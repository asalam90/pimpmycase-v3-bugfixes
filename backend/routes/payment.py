"""Simplified Payment processing API routes - Stripe only (No Chinese API)"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from backend.schemas.payment import CheckoutSessionRequest, PaymentSuccessRequest
from backend.services.payment_service import initialize_stripe
from db_services import OrderService, BrandService, PhoneModelService, TemplateService, OrderImageService
from models import Brand, PhoneModel
from datetime import datetime, timezone
import stripe
import os
from backend.config.promotional_pricing import get_promotional_price, is_free_promotional_machine

router = APIRouter()

# Stripe is initialized in the payment service
stripe_client = initialize_stripe()

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CheckoutSessionRequest,
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout session and save order data to database BEFORE payment"""
    try:
        print(f"DEBUG - Received checkout request with final_image_url: {request.final_image_url}")

        # Handle both amount_pence (new) and amount (legacy)
        if hasattr(request, 'amount_pence') and request.amount_pence:
            amount_pence = int(request.amount_pence)
            amount_pounds = amount_pence / 100
        elif hasattr(request, 'amount') and request.amount:
            amount_pence = int(request.amount * 100)
            amount_pounds = request.amount
        else:
            raise ValueError("No amount or amount_pence provided")

        # ============================================
        # PROMOTIONAL: Override price for promotional machines
        # TODO: Remove when promotional period ends
        # ============================================
        machine_id = request.machine_id or None
        if machine_id and is_free_promotional_machine(machine_id):
            print(f"🎉 PROMOTIONAL: Free pricing for machine {machine_id}")
            amount_pence = 0
            amount_pounds = 0.00
        # ============================================

        print(f"Payment amount: £{amount_pounds} ({amount_pence} pence)")

        # Determine the base URL for redirects from environment
        base_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        print(f"Using base URL for Stripe redirect: {base_url}")

        # Build metadata with customer information
        metadata = {
            'template_id': request.template_id,
            'brand': request.brand,
            'model': request.model,
            'color': request.color
        }

        # Add entry source tracking to metadata
        if request.entry_source:
            metadata['entry_source'] = request.entry_source
        if request.machine_id:
            metadata['machine_id'] = request.machine_id
        if request.is_machine_collection:
            metadata['is_machine_collection'] = str(request.is_machine_collection)

        # Add customer information to metadata (E-COMMERCE fields)
        if request.customer_name:
            metadata['customer_name'] = request.customer_name
        if request.customer_email:
            metadata['customer_email'] = request.customer_email
        if request.customer_phone:
            metadata['customer_phone'] = request.customer_phone
        if request.shipping_address_line1:
            metadata['shipping_address_line1'] = request.shipping_address_line1
        if request.shipping_address_line2:
            metadata['shipping_address_line2'] = request.shipping_address_line2
        if request.shipping_city:
            metadata['shipping_city'] = request.shipping_city
        if request.shipping_postcode:
            metadata['shipping_postcode'] = request.shipping_postcode
        if request.shipping_country:
            metadata['shipping_country'] = request.shipping_country
        if request.customer_notes:
            metadata['customer_notes'] = request.customer_notes[:500]  # Stripe metadata limit

        # Create checkout session first
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'gbp',
                    'product_data': {
                        'name': f'Custom Phone Case - {request.template_id}',
                        'description': f'{request.brand} {request.model}',
                    },
                    'unit_amount': amount_pence,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{base_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{base_url}/payment-cancel',
            locale='en-GB',
            customer_email=request.customer_email if request.customer_email else None,
            metadata=metadata
        )

        # CRITICAL FIX: Create pending order in database with final_image_url BEFORE payment
        from models import Order, Brand, PhoneModel, Template, OrderImage

        # Get brand, model, template from database
        brand_name = request.brand
        brand_name_map = {'APPLE': 'iPhone', 'Apple': 'iPhone', 'apple': 'iPhone', 'SAMSUNG': 'Samsung', 'samsung': 'Samsung'}
        brand_name = brand_name_map.get(brand_name, brand_name)

        brand = db.query(Brand).filter(Brand.display_name.ilike(brand_name)).first()
        if not brand:
            brand = db.query(Brand).filter(Brand.id.ilike(brand_name)).first()
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_name}")

        model = db.query(PhoneModel).filter(
            PhoneModel.brand_id == brand.id,
            PhoneModel.display_name.ilike(request.model)
        ).first()
        if not model:
            raise HTTPException(status_code=404, detail=f"Model not found: {request.model}")

        template = db.query(Template).filter(Template.id == request.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail=f"Template not found: {request.template_id}")

        # Create pending order directly
        pending_order = Order(
            status="pending_payment",
            total_amount=amount_pounds,
            brand_id=brand.id,
            model_id=model.id,
            template_id=template.id,
            customer_name=request.customer_name or "Guest Customer",
            customer_email=request.customer_email,
            customer_phone=request.customer_phone,
            shipping_address_line1=request.shipping_address_line1,
            shipping_address_line2=request.shipping_address_line2,
            shipping_city=request.shipping_city,
            shipping_postcode=request.shipping_postcode,
            shipping_country=request.shipping_country,
            customer_notes=request.customer_notes,
            stripe_session_id=session.id  # Link to Stripe session
        )
        db.add(pending_order)
        db.commit()
        db.refresh(pending_order)
        print(f"Created pending order: {pending_order.id} linked to Stripe session: {session.id}")

        # Save final_image_url to database NOW (before payment)
        if request.final_image_url:
            try:
                order_image = OrderImage(
                    order_id=pending_order.id,
                    image_path=request.final_image_url,  # FIXED: Use image_path, not image_url
                    image_type="final"
                )
                db.add(order_image)
                db.commit()
                print(f"✅ Saved final_image_url to database: {request.final_image_url[:80]}...")
            except Exception as img_error:
                print(f"Failed to save image to pending order: {img_error}")
                # Continue even if image fails

        return {
            "checkout_url": session.url,
            "session_id": session.id
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout session creation failed: {str(e)}")

@router.post("/process-payment-success")
async def process_payment_success(
    request: PaymentSuccessRequest,
    db: Session = Depends(get_db)
):
    """Process successful payment - retrieve pending order from database and complete it"""
    try:
        print(f"Processing payment for session: {request.session_id}")

        # Verify Stripe payment
        session = stripe.checkout.Session.retrieve(request.session_id)

        if session.payment_status != 'paid':
            raise HTTPException(status_code=400, detail="Payment not completed")

        # Extract entry source from metadata
        entry_source = session.metadata.get('entry_source', 'vanilla')
        machine_id = session.metadata.get('machine_id')
        is_machine_collection = session.metadata.get('is_machine_collection', 'false').lower() == 'true'

        # Determine device_id based on entry source
        if entry_source == 'qr' and machine_id:
            device_id = machine_id  # Use machine from QR code
        else:
            device_id = os.getenv('CHINESE_API_DEVICE_ID', 'JMSOOMSZRQO9')  # Default e-commerce device

        print(f"Entry source: {entry_source}, Device ID: {device_id}, Machine collection: {is_machine_collection}")

        # CRITICAL FIX: Find the pending order by stripe_session_id in database
        from models import Order, OrderImage

        pending_order = db.query(Order).filter(Order.stripe_session_id == request.session_id).first()

        if not pending_order:
            raise HTTPException(status_code=404, detail=f"Pending order not found for session {request.session_id}")

        print(f"Found pending order: {pending_order.id}")

        # Retrieve final_image_url from database
        order_images = db.query(OrderImage).filter(OrderImage.order_id == pending_order.id).all()
        final_image_url = None
        for img in order_images:
            if img.image_type == "final":
                final_image_url = img.image_path  # FIXED: Use image_path, not image_url
                print(f"✅ Retrieved final_image_url from database: {final_image_url[:80]}...")
                break

        if not final_image_url:
            print(f"⚠️ WARNING: No final image found in database for order {pending_order.id}")

        # Update pending order to paid status
        pending_order.stripe_payment_intent_id = session.payment_intent
        pending_order.payment_status = "paid"
        pending_order.paid_at = datetime.now(timezone.utc)
        pending_order.status = "paid"
        db.commit()
        db.refresh(pending_order)

        order = pending_order  # Use the pending order as our order
        print(f"Updated order {order.id} to paid status")

        # Get brand and model for Chinese API submission
        from models import Brand, PhoneModel

        brand = db.query(Brand).filter(Brand.id == order.brand_id).first()
        model = db.query(PhoneModel).filter(PhoneModel.id == order.model_id).first()

        # Generate human-readable order number (PMC-XXXX)
        # Get total count of all orders for global sequential number
        from models import Order
        total_orders_count = db.query(Order).count()

        # Format: PMC-12345 (global sequential, never resets)
        queue_number = f"PMC-{total_orders_count:05d}"
        order.queue_number = queue_number
        db.commit()
        db.refresh(order)

        print(f"Payment processing complete. Order: {order.id}, Queue: {queue_number}")

        # ============================================
        # Chinese API Integration (E-commerce flow)
        # ============================================
        chinese_order_id = None
        chinese_payment_id = None

        try:
            # Only submit to Chinese API if model has chinese_model_id
            if model.chinese_model_id:
                print(f"Submitting order to Chinese API for manufacturing...")

                from backend.utils.helpers import generate_third_id
                from backend.services.chinese_payment_service import (
                    send_payment_to_chinese_api,
                    send_payment_status_to_chinese_api,
                    send_order_data_to_chinese_api
                )
                from backend.services.file_service import generate_partner_specific_token, generate_uk_download_url

                # Generate unique third_id for this payment
                third_id = generate_third_id("PYEN")
                print(f"Generated third_id: {third_id}")

                # Step 1: Send payment data to Chinese API (pay_type: 12 for Stripe/app payments)
                pay_result = send_payment_to_chinese_api(
                    mobile_model_id=model.chinese_model_id,
                    device_id=device_id,  # Dynamic: QR machine or default e-commerce device
                    third_id=third_id,
                    pay_amount=float(order.total_amount),
                    pay_type=12  # 12 = Stripe/app payment (not vending machine)
                )

                if pay_result.get("code") == 200:
                    chinese_payment_id = pay_result.get('data', {}).get('id')
                    print(f"Chinese payment ID received: {chinese_payment_id}")

                    # Step 2: Send payment status (already paid via Stripe)
                    status_result = send_payment_status_to_chinese_api(
                        third_id=third_id,
                        status=3,  # 3 = paid
                        pay_amount=float(order.total_amount)
                    )
                    print(f"Payment status sent to Chinese API: {status_result.get('code')}")

                    # Step 3: Submit order for manufacturing
                    # Generate secure download URL for the final design image
                    authenticated_image_url = None
                    if final_image_url:  # Use the final_image_url from Stripe metadata
                        # Generate authenticated URL for Chinese API to download the image
                        # Extract filename from URL (strip any existing query parameters)
                        import os
                        from urllib.parse import urlparse

                        # Parse URL and extract just the filename without query parameters
                        parsed_url = urlparse(final_image_url)
                        filename = os.path.basename(parsed_url.path)  # Get filename from path only

                        # Generate secure token for Chinese manufacturing (48h expiry)
                        token = generate_partner_specific_token(filename, partner_type="chinese_manufacturing")
                        # Build full URL with NEW token (replacing any old token)
                        base_url = generate_uk_download_url(filename)
                        authenticated_image_url = f"{base_url}?token={token}"
                        print(f"Generated authenticated URL for Chinese API: {authenticated_image_url[:80]}...")

                    if authenticated_image_url and chinese_payment_id:
                        # Get mobile_shell_id from request or use default
                        mobile_shell_id = request.order_data.get('mobile_shell_id') if request.order_data else None
                        if not mobile_shell_id:
                            mobile_shell_id = "MS_DEFAULT"  # Default shell type

                        order_result = send_order_data_to_chinese_api(
                            third_pay_id=chinese_payment_id,
                            third_id=third_id,
                            mobile_model_id=model.chinese_model_id,
                            pic=authenticated_image_url,
                            device_id=device_id,  # Dynamic: QR machine or default e-commerce device
                            mobile_shell_id=mobile_shell_id
                        )

                        if order_result.get("code") == 200:
                            chinese_order_id = order_result.get('data', {}).get('id')
                            chinese_queue_no = order_result.get('data', {}).get('queue_no')
                            print(f"Order submitted to Chinese API - Order ID: {chinese_order_id}, Queue: {chinese_queue_no}")

                            # Update order with Chinese API IDs
                            order.chinese_payment_id = chinese_payment_id
                            order.chinese_order_id = chinese_order_id
                            order.third_party_payment_id = third_id
                            order.chinese_payment_status = 3  # Paid
                            if chinese_queue_no:
                                order.queue_number = chinese_queue_no  # Use Chinese queue number
                            order.status = "sent_to_chinese"
                            db.commit()
                            db.refresh(order)
                        else:
                            print(f"Failed to submit order to Chinese API: {order_result.get('msg')}")
                    else:
                        print(f"Cannot submit order - missing image (final_image_url={final_image_url}, authenticated_image_url={authenticated_image_url}) or chinese_payment_id={chinese_payment_id}")
                else:
                    print(f"Failed to send payment to Chinese API: {pay_result.get('msg')}")

        except Exception as chinese_error:
            print(f"Chinese API integration failed (continuing with local order): {str(chinese_error)}")
            import traceback
            traceback.print_exc()
            # Don't fail the entire payment - order is still created locally

        return {
            "success": True,
            "order_id": order.id,
            "queue_no": order.queue_number,
            "status": order.status,
            "brand": brand.display_name if brand else "Unknown",
            "model": model.display_name if model else "Unknown",
            "template": order.template_id,
            "amount": session.amount_total / 100,
            "currency": session.currency.upper(),
            "chinese_order_id": chinese_order_id,
            "chinese_payment_id": chinese_payment_id,
            "entry_source": entry_source,
            "is_machine_collection": is_machine_collection,
            "collection_device_id": device_id if is_machine_collection else None,
            "message": "Payment successful - Order created" + (" and sent to manufacturer" if chinese_order_id else "")
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Payment processing error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

@router.get("/payment-success")
async def payment_success_page(session_id: str, db: Session = Depends(get_db)):
    """Handle payment success redirect from Stripe"""
    try:
        print(f"Payment success page accessed with session: {session_id}")

        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != 'paid':
            raise HTTPException(status_code=400, detail="Payment not completed")

        # Get metadata from session
        template_id = session.metadata.get('template_id', 'classic')
        brand_name = session.metadata.get('brand', 'iPhone')
        model_name = session.metadata.get('model', 'Unknown Model')
        color = session.metadata.get('color', '')

        # Try to find order by stripe session ID
        order = db.query(models.Order).filter_by(stripe_session_id=session_id).first() if 'models' in dir() else None

        return {
            "success": True,
            "session_id": session_id,
            "payment_id": session.payment_intent,
            "queue_no": order.queue_number if order else None,
            "status": "paid",
            "brand": brand_name,
            "model": model_name,
            "color": color,
            "template_id": template_id,
            "amount": session.amount_total / 100
        }

    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        print(f"Payment success error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment success failed: {str(e)}")
