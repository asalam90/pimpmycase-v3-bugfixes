"""Chinese API Image Preview and Debug Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order, OrderImage
from backend.services.file_service import generate_partner_specific_token, generate_uk_download_url
from typing import Optional
import os

router = APIRouter()

@router.get("/api/chinese/debug/order-images/{order_id}")
async def preview_order_images_for_chinese_api(order_id: str, db: Session = Depends(get_db)):
    """Preview what images would be sent to Chinese API for an order"""
    try:
        # Get the order
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Get all images for this order
        order_images = db.query(OrderImage).filter(OrderImage.order_id == order_id).all()

        if not order_images:
            return {
                "success": False,
                "message": "No images found for this order",
                "order_id": order_id
            }

        image_details = []
        for img in order_images:
            # Generate the URL that would be sent to Chinese API
            filename = os.path.basename(img.image_path)
            token = generate_partner_specific_token(filename, partner_type="chinese_manufacturing")
            base_url = generate_uk_download_url(filename)
            authenticated_url = f"{base_url}?token={token}"

            image_details.append({
                "image_id": img.id,
                "image_type": img.image_type,
                "filename": filename,
                "local_path": img.image_path,
                "chinese_api_url": authenticated_url,
                "base_url": base_url,
                "token_expiry_hours": 48,
                "created_at": img.created_at.isoformat() if img.created_at else None
            })

        return {
            "success": True,
            "order_id": order_id,
            "order_number": order.order_number,
            "chinese_order_id": order.chinese_order_id,
            "chinese_payment_id": order.chinese_payment_id,
            "total_images": len(image_details),
            "images": image_details,
            "note": "These are the URLs that will be sent to Chinese manufacturing API"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview images: {str(e)}")


@router.get("/api/chinese/debug/test-image-url")
async def test_chinese_image_url(image_filename: str):
    """Test what URL would be generated for an image file"""
    try:
        # Generate secure token for Chinese manufacturing (48h expiry)
        token = generate_partner_specific_token(image_filename, partner_type="chinese_manufacturing")

        # Build full URL with token
        base_url = generate_uk_download_url(image_filename)
        authenticated_url = f"{base_url}?token={token}"

        return {
            "success": True,
            "filename": image_filename,
            "base_url": base_url,
            "authenticated_url": authenticated_url,
            "token": token[:20] + "..." if len(token) > 20 else token,
            "token_expiry_hours": 48,
            "partner_type": "chinese_manufacturing",
            "usage": "This URL would be sent to Chinese API in the 'pic' field"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate test URL: {str(e)}")


@router.get("/api/orders/{order_id}/chinese-submission-preview")
async def preview_chinese_api_submission(order_id: str, db: Session = Depends(get_db)):
    """Preview the complete payload that would be sent to Chinese API"""
    try:
        # Get the order
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Get the final image
        final_image = db.query(OrderImage).filter(
            OrderImage.order_id == order_id,
            OrderImage.image_type == "final"
        ).first()

        if not final_image:
            return {
                "success": False,
                "message": "No final image found for this order",
                "order_id": order_id
            }

        # Generate the Chinese API URL
        filename = os.path.basename(final_image.image_path)
        token = generate_partner_specific_token(filename, partner_type="chinese_manufacturing")
        base_url = generate_uk_download_url(filename)
        final_image_url = f"{base_url}?token={token}"

        # Get phone model
        from models import PhoneModel
        model = db.query(PhoneModel).filter(PhoneModel.id == order.model_id).first()

        # Build the payload that would be sent to Chinese API
        chinese_payload = {
            "third_pay_id": order.chinese_payment_id or "MSPY_PENDING",
            "third_id": order.third_party_payment_id or "PYEN_PENDING",
            "mobile_model_id": model.chinese_model_id if model else "UNKNOWN",
            "pic": final_image_url,
            "device_id": "JMSOOMSZRQO9",
            "mobile_shell_id": "MS_DEFAULT"
        }

        return {
            "success": True,
            "order_id": order_id,
            "order_number": order.order_number,
            "order_status": order.status,
            "chinese_api_endpoint": "https://api.inkele.net/mobileShell/en/order/orderData",
            "payload": chinese_payload,
            "image_details": {
                "filename": filename,
                "local_path": final_image.image_path,
                "chinese_url": final_image_url,
                "token_valid_for": "48 hours"
            },
            "model_details": {
                "model_name": model.display_name if model else "Unknown",
                "chinese_model_id": model.chinese_model_id if model else None,
                "brand_id": order.brand_id
            },
            "note": "This is exactly what would be sent to Chinese manufacturing API"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview submission: {str(e)}")
