"""New API routes for database-driven phone case platform"""

from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Request
from sqlalchemy.orm import Session
from database import get_db
from db_services import *
from models import *
from typing import Optional, List, Dict, Any
import json
from decimal import Decimal
from pathlib import Path
from security_middleware import validate_relaxed_api_security, security_manager
from pydantic import BaseModel

# Pydantic models for request bodies
class StockUpdateRequest(BaseModel):
    stock: int

class PriceUpdateRequest(BaseModel):
    price: float

# Create API router
router = APIRouter()

# Brand endpoints
@router.get("/api/brands")
async def get_brands(db: Session = Depends(get_db)):
    """Get all phone brands directly from Chinese API"""
    try:
        from backend.services.chinese_payment_service import get_chinese_brands

        chinese_result = get_chinese_brands()

        if not chinese_result.get("success") or not chinese_result.get("brands"):
            raise HTTPException(status_code=500, detail="Failed to fetch brands from Chinese API")

        print(f"Chinese API returned {len(chinese_result['brands'])} brands")

        brand_list = []
        # Map Chinese brands to our format
        for chinese_brand in chinese_result["brands"]:
            # Find matching local brand by chinese_brand_id
            local_brand = db.query(Brand).filter(Brand.chinese_brand_id == chinese_brand.get("id")).first()

            if local_brand and local_brand.is_available:
                brand_list.append({
                    "id": local_brand.id,
                    "name": local_brand.display_name,
                    "frame_color": local_brand.frame_color,
                    "button_color": local_brand.button_color,
                    "available": True,
                    "enabled": True,
                    "subtitle": local_brand.subtitle,
                    "chinese_brand_id": chinese_brand.get("id")
                })

        print(f"Successfully mapped {len(brand_list)} brands from Chinese API")
        return {"success": True, "brands": brand_list}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Brands API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get brands: {str(e)}")

@router.get("/api/brands/{brand_id}/models")
async def get_phone_models(brand_id: str, db: Session = Depends(get_db), device_id: str = "JMSOOMSZRQO9"):
    """Get phone models directly from Chinese API"""
    try:
        # Get brand from database
        brand = BrandService.get_brand_by_id(db, brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand '{brand_id}' not found")

        if not brand.chinese_brand_id:
            raise HTTPException(status_code=400, detail=f"Brand '{brand_id}' does not have Chinese API mapping")

        from backend.services.chinese_payment_service import get_chinese_stock
        chinese_result = get_chinese_stock(device_id, brand.chinese_brand_id)

        if not chinese_result.get("success") or not chinese_result.get("stock_items"):
            error_msg = chinese_result.get("message", "Failed to fetch models from Chinese API")
            raise HTTPException(status_code=500, detail=error_msg)

        print(f"Chinese API returned {len(chinese_result['stock_items'])} models for brand {brand.display_name}")

        model_list = []
        # Map Chinese stock items to our format
        for chinese_item in chinese_result["stock_items"]:
            # Find matching local model by chinese_model_id
            local_model = db.query(PhoneModel).filter(
                PhoneModel.chinese_model_id == chinese_item.get("mobile_model_id"),
                PhoneModel.brand_id == brand_id
            ).first()

            if local_model and local_model.is_available:
                model_list.append({
                    "id": local_model.id,
                    "name": local_model.display_name,
                    "display_name": local_model.display_name,
                    "price": float(local_model.price),
                    "stock": chinese_item.get("stock", 0),  # Real-time stock from Chinese API
                    "is_available": chinese_item.get("stock", 0) > 0,
                    "chinese_model_id": chinese_item.get("mobile_model_id"),
                    "mobile_shell_id": chinese_item.get("mobile_shell_id"),  # For order submission
                    "width": float(chinese_item.get("width")) if chinese_item.get("width") else None,
                    "height": float(chinese_item.get("height")) if chinese_item.get("height") else None
                })

        print(f"Successfully mapped {len(model_list)} models from Chinese API")
        return {
            "success": True,
            "models": model_list,
            "brand": {
                "id": brand.id,
                "name": brand.display_name,
                "chinese_brand_id": brand.chinese_brand_id
            },
            "total_models": len(model_list),
            "in_stock_models": len([m for m in model_list if m["stock"] > 0])
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Models API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")

# Template endpoints
@router.get("/api/templates")
async def get_templates(include_inactive: bool = False, db: Session = Depends(get_db)):
    """Get all templates"""
    try:
        templates = TemplateService.get_all_templates(db, include_inactive)
        return {
            "success": True,
            "templates": [
                {
                    "id": template.id,
                    "name": template.name,
                    "description": template.description,
                    "price": float(template.price),
                    "currency": template.currency,
                    "category": template.category,
                    "image_count": template.image_count,
                    "features": template.features,
                    "display_price": template.display_price,
                    "is_active": template.is_active
                }
                for template in templates
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")

@router.get("/api/templates/{template_id}")
async def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get specific template details"""
    try:
        template = TemplateService.get_template_by_id(db, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {
            "success": True,
            "template": {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "price": float(template.price),
                "currency": template.currency,
                "category": template.category,
                "image_count": template.image_count,
                "features": template.features,
                "display_price": template.display_price,
                "is_active": template.is_active
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get template: {str(e)}")

# Font endpoints
@router.get("/api/fonts")
async def get_fonts(include_inactive: bool = False, db: Session = Depends(get_db)):
    """Get all fonts"""
    try:
        fonts = FontService.get_all_fonts(db, include_inactive)
        return {
            "success": True,
            "fonts": [
                {
                    "id": font.id,
                    "name": font.name,
                    "css_style": font.css_style,
                    "font_weight": font.font_weight,
                    "is_google_font": font.is_google_font,
                    "google_font_url": font.google_font_url,
                    "is_active": font.is_active
                }
                for font in fonts
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get fonts: {str(e)}")

# Font management endpoints
@router.post("/api/admin/fonts")
async def create_font(
    name: str = Form(...),
    css_style: str = Form(...),
    font_weight: str = Form("400"),
    is_google_font: bool = Form(False),
    google_font_url: str = Form(None),
    display_order: int = Form(0),
    is_active: bool = Form(True),
    db: Session = Depends(get_db)
):
    """Create new font"""
    try:
        font_data = {
            "name": name,
            "css_style": css_style,
            "font_weight": font_weight,
            "is_google_font": is_google_font,
            "google_font_url": google_font_url,
            "display_order": display_order,
            "is_active": is_active
        }
        
        font = FontService.create_font(db, font_data)
        return {
            "success": True,
            "font": {
                "id": font.id,
                "name": font.name,
                "css_style": font.css_style,
                "font_weight": font.font_weight,
                "is_google_font": font.is_google_font,
                "google_font_url": font.google_font_url,
                "display_order": font.display_order,
                "is_active": font.is_active,
                "created_at": font.created_at.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create font: {str(e)}")

@router.put("/api/admin/fonts/{font_id}")
async def update_font(
    font_id: str,
    name: str = Form(None),
    css_style: str = Form(None),
    font_weight: str = Form(None),
    is_google_font: bool = Form(None),
    google_font_url: str = Form(None),
    display_order: int = Form(None),
    is_active: bool = Form(None),
    db: Session = Depends(get_db)
):
    """Update font"""
    try:
        font_data = {}
        if name is not None: font_data["name"] = name
        if css_style is not None: font_data["css_style"] = css_style
        if font_weight is not None: font_data["font_weight"] = font_weight
        if is_google_font is not None: font_data["is_google_font"] = is_google_font
        if google_font_url is not None: font_data["google_font_url"] = google_font_url
        if display_order is not None: font_data["display_order"] = display_order
        if is_active is not None: font_data["is_active"] = is_active
        
        font = FontService.update_font(db, font_id, font_data)
        if not font:
            raise HTTPException(status_code=404, detail="Font not found")
        
        return {
            "success": True,
            "font": {
                "id": font.id,
                "name": font.name,
                "css_style": font.css_style,
                "font_weight": font.font_weight,
                "is_google_font": font.is_google_font,
                "google_font_url": font.google_font_url,
                "display_order": font.display_order,
                "is_active": font.is_active
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update font: {str(e)}")

@router.delete("/api/admin/fonts/{font_id}")
async def delete_font(font_id: str, db: Session = Depends(get_db)):
    """Delete font"""
    try:
        success = FontService.delete_font(db, font_id)
        if not success:
            raise HTTPException(status_code=404, detail="Font not found")
        
        return {"success": True, "message": "Font deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete font: {str(e)}")

@router.put("/api/admin/fonts/{font_id}/toggle")
async def toggle_font_activation(font_id: str, db: Session = Depends(get_db)):
    """Toggle font activation status"""
    try:
        font = FontService.toggle_activation(db, font_id)
        if not font:
            raise HTTPException(status_code=404, detail="Font not found")
        
        return {
            "success": True,
            "font": {
                "id": font.id,
                "name": font.name,
                "is_active": font.is_active
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle font activation: {str(e)}")

# Color endpoints
@router.get("/api/colors/{color_type}")
async def get_colors(color_type: str, include_inactive: bool = False, db: Session = Depends(get_db)):
    """Get colors by type (background or text)"""
    try:
        if color_type not in ['background', 'text']:
            raise HTTPException(status_code=400, detail="Color type must be 'background' or 'text'")
        
        colors = ColorService.get_colors_by_type(db, color_type, include_inactive)
        return {
            "success": True,
            "colors": [
                {
                    "id": color.id,
                    "name": color.name,
                    "hex_value": color.hex_value,
                    "css_classes": color.css_classes,
                    "color_type": color.color_type,
                    "is_active": color.is_active
                }
                for color in colors
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get colors: {str(e)}")

# Color management endpoints
@router.post("/api/admin/colors")
async def create_color(
    name: str = Form(...),
    hex_value: str = Form(...),
    color_type: str = Form(...),
    css_classes: str = Form(None),
    display_order: int = Form(0),
    is_active: bool = Form(True),
    db: Session = Depends(get_db)
):
    """Create new color"""
    try:
        if color_type not in ['background', 'text']:
            raise HTTPException(status_code=400, detail="Color type must be 'background' or 'text'")
        
        color_data = {
            "name": name,
            "hex_value": hex_value,
            "color_type": color_type,
            "css_classes": json.loads(css_classes) if css_classes else None,
            "display_order": display_order,
            "is_active": is_active
        }
        
        color = ColorService.create_color(db, color_data)
        return {
            "success": True,
            "color": {
                "id": color.id,
                "name": color.name,
                "hex_value": color.hex_value,
                "color_type": color.color_type,
                "css_classes": color.css_classes,
                "display_order": color.display_order,
                "is_active": color.is_active,
                "created_at": color.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create color: {str(e)}")

@router.put("/api/admin/colors/{color_id}")
async def update_color(
    color_id: str,
    name: str = Form(None),
    hex_value: str = Form(None),
    color_type: str = Form(None),
    css_classes: str = Form(None),
    display_order: int = Form(None),
    is_active: bool = Form(None),
    db: Session = Depends(get_db)
):
    """Update color"""
    try:
        color_data = {}
        if name is not None: color_data["name"] = name
        if hex_value is not None: color_data["hex_value"] = hex_value
        if color_type is not None: 
            if color_type not in ['background', 'text']:
                raise HTTPException(status_code=400, detail="Color type must be 'background' or 'text'")
            color_data["color_type"] = color_type
        if css_classes is not None: color_data["css_classes"] = json.loads(css_classes) if css_classes else None
        if display_order is not None: color_data["display_order"] = display_order
        if is_active is not None: color_data["is_active"] = is_active
        
        color = ColorService.update_color(db, color_id, color_data)
        if not color:
            raise HTTPException(status_code=404, detail="Color not found")
        
        return {
            "success": True,
            "color": {
                "id": color.id,
                "name": color.name,
                "hex_value": color.hex_value,
                "color_type": color.color_type,
                "css_classes": color.css_classes,
                "display_order": color.display_order,
                "is_active": color.is_active
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update color: {str(e)}")

@router.delete("/api/admin/colors/{color_id}")
async def delete_color(color_id: str, db: Session = Depends(get_db)):
    """Delete color"""
    try:
        success = ColorService.delete_color(db, color_id)
        if not success:
            raise HTTPException(status_code=404, detail="Color not found")
        
        return {"success": True, "message": "Color deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete color: {str(e)}")

@router.put("/api/admin/colors/{color_id}/toggle")
async def toggle_color_activation(color_id: str, db: Session = Depends(get_db)):
    """Toggle color activation status"""
    try:
        color = ColorService.toggle_activation(db, color_id)
        if not color:
            raise HTTPException(status_code=404, detail="Color not found")
        
        return {
            "success": True,
            "color": {
                "id": color.id,
                "name": color.name,
                "is_active": color.is_active
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle color activation: {str(e)}")

# Order endpoints
@router.post("/api/orders/create")
async def create_order(
    session_id: str = Form(...),
    brand_id: str = Form(...),
    phone_model_id: str = Form(..., alias="model_id"),
    template_id: str = Form(...),
    user_data: str = Form("{}"),  # JSON string
    db: Session = Depends(get_db)
):
    """Create new order"""
    try:
        # Validate brand, model, and template exist
        brand = BrandService.get_brand_by_id(db, brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        model = PhoneModelService.get_model_by_id(db, phone_model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Phone model not found")
        
        template = TemplateService.get_template_by_id(db, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check stock
        if model.stock <= 0:
            raise HTTPException(status_code=400, detail="Phone model out of stock")
        
        # Parse user data
        try:
            user_data_dict = json.loads(user_data)
        except json.JSONDecodeError:
            user_data_dict = {}
        
        # Calculate total amount
        total_amount = float(template.price)
        
        # Create order
        order_data = {
            "session_id": session_id,
            "brand_id": brand_id,
            "model_id": phone_model_id,
            "template_id": template_id,
            "user_data": user_data_dict,
            "total_amount": total_amount,
            "status": "created"
        }
        
        order = OrderService.create_order(db, order_data)
        
        return {
            "success": True,
            "order": {
                "id": order.id,
                "session_id": order.session_id,
                "brand": brand.name,
                "model": model.name,
                "template": template.name,
                "total_amount": float(order.total_amount),
                "currency": order.currency,
                "status": order.status,
                "created_at": order.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.get("/api/orders/{order_id}")
async def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get order details"""
    try:
        order = OrderService.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Get order images
        images = OrderImageService.get_order_images(db, order_id)
        
        return {
            "success": True,
            "order": {
                "id": order.id,
                "session_id": order.session_id,
                "brand": order.brand.name if order.brand else None,
                "model": order.phone_model.name if order.phone_model else None,
                "template": order.template.name if order.template else None,
                "total_amount": float(order.total_amount),
                "currency": order.currency,
                "status": order.status,
                "payment_status": order.payment_status,
                "chinese_payment_id": order.chinese_payment_id,
                "chinese_order_id": order.chinese_order_id,
                "queue_number": order.queue_number,
                "created_at": order.created_at.isoformat(),
                "updated_at": order.updated_at.isoformat() if order.updated_at else None,
                "completed_at": order.completed_at.isoformat() if order.completed_at else None,
                "images": [
                    {
                        "id": img.id,
                        "image_path": img.image_path,
                        "image_type": img.image_type,
                        "ai_params": img.ai_params,
                        "chinese_image_url": img.chinese_image_url,
                        "created_at": img.created_at.isoformat()
                    }
                    for img in images
                ]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get order: {str(e)}")

@router.put("/api/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str = Form(...),
    chinese_data: str = Form("{}"),  # JSON string with Chinese API data
    db: Session = Depends(get_db)
):
    """Update order status"""
    try:
        # Parse Chinese API data
        try:
            chinese_data_dict = json.loads(chinese_data)
        except json.JSONDecodeError:
            chinese_data_dict = {}
        
        order = OrderService.update_order_status(db, order_id, status, chinese_data_dict)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {
            "success": True,
            "order": {
                "id": order.id,
                "status": order.status,
                "chinese_payment_id": order.chinese_payment_id,
                "chinese_order_id": order.chinese_order_id,
                "queue_number": order.queue_number,
                "updated_at": order.updated_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update order status: {str(e)}")

# Admin endpoints
@router.get("/api/admin/orders")
async def get_recent_orders(limit: int = 50, request: Request = None, db: Session = Depends(get_db)):
    """Get recent orders for admin dashboard"""
    try:
        # Apply relaxed security for all users accessing admin endpoints
        if request:
            # Use relaxed validation for all users
            validate_relaxed_api_security(request)
        
        orders = OrderService.get_recent_orders(db, limit)
        return {
            "success": True,
            "orders": [
                {
                    "id": order.id,
                    "session_id": order.session_id,
                    "brand": order.brand.name if order.brand else None,
                    "model": order.phone_model.name if order.phone_model else None,
                    "template": order.template.name if order.template else None,
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "payment_status": order.payment_status,
                    "chinese_payment_id": getattr(order, 'chinese_payment_id', None),
                    "third_party_payment_id": getattr(order, 'third_party_payment_id', None),
                    "chinese_payment_status": getattr(order, 'chinese_payment_status', None),
                    "queue_number": order.queue_number,
                    "created_at": order.created_at.isoformat(),
                    "completed_at": order.completed_at.isoformat() if order.completed_at else None,
                    "images": [
                        {
                            "id": img.id,
                            "image_path": img.image_path,
                            "image_type": img.image_type,
                            "ai_params": img.ai_params,
                            "chinese_image_url": getattr(img, 'chinese_image_url', None),
                            "created_at": img.created_at.isoformat()
                        }
                        for img in order.images
                    ] if order.images else []
                }
                for order in orders
            ]
        }
    except Exception as e:
        print(f"Admin orders error: {str(e)}")  # Log for debugging
        raise HTTPException(status_code=500, detail=f"Failed to get orders: {str(e)}")

@router.get("/api/admin/stats")
async def get_order_stats(request: Request = None, db: Session = Depends(get_db)):
    """Get order statistics for admin dashboard"""
    try:
        # Apply relaxed security for all users accessing admin endpoints
        if request:
            # Use relaxed validation for all users
            validate_relaxed_api_security(request)
        
        stats = OrderService.get_order_stats(db)
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        print(f"Admin stats error: {str(e)}")  # Log for debugging
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.put("/api/admin/models/{model_id}/stock")
async def update_model_stock(
    model_id: str,
    request: StockUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update phone model stock"""
    try:
        if request.stock < 0:
            raise HTTPException(status_code=400, detail="Stock cannot be negative")
        
        model = PhoneModelService.update_stock(db, model_id, request.stock)
        if not model:
            raise HTTPException(status_code=404, detail="Phone model not found")
        
        return {
            "success": True,
            "model": {
                "id": model.id,
                "name": model.name,
                "stock": model.stock,
                "updated_at": model.updated_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update stock: {str(e)}")

# Phone model management endpoints
@router.post("/api/admin/models")
async def create_phone_model(
    name: str = Form(...),
    brand_id: str = Form(...),
    price: str = Form(...),
    chinese_model_id: str = Form(None),
    display_order: int = Form(0),
    stock: int = Form(0),
    is_available: bool = Form(True),
    is_featured: bool = Form(False),
    db: Session = Depends(get_db)
):
    """Create new phone model"""
    try:
        # Convert string to float and validate
        try:
            price_float = float(price)
        except ValueError:
            raise HTTPException(status_code=400, detail="Price must be a valid number")
        
        if price_float < 0:
            raise HTTPException(status_code=400, detail="Price cannot be negative")
        
        model_data = {
            "name": name,
            "brand_id": brand_id,
            "price": price_float,
            "chinese_model_id": chinese_model_id,
            "display_order": display_order,
            "stock": stock,
            "is_available": is_available,
            "is_featured": is_featured
        }
        
        model = PhoneModelService.create_model(db, model_data)
        return {
            "success": True,
            "model": {
                "id": model.id,
                "name": model.name,
                "brand_id": model.brand_id,
                "price": float(model.price),
                "chinese_model_id": model.chinese_model_id,
                "display_order": model.display_order,
                "stock": model.stock,
                "is_available": model.is_available,
                "is_featured": model.is_featured,
                "created_at": model.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create phone model: {str(e)}")

@router.put("/api/admin/models/{model_id}")
async def update_phone_model(
    model_id: str,
    name: str = Form(None),
    price: str = Form(None),
    chinese_model_id: str = Form(None),
    display_order: int = Form(None),
    stock: int = Form(None),
    is_available: bool = Form(None),
    is_featured: bool = Form(None),
    db: Session = Depends(get_db)
):
    """Update phone model"""
    try:
        model_data = {}
        if name is not None: model_data["name"] = name
        if chinese_model_id is not None: model_data["chinese_model_id"] = chinese_model_id
        if display_order is not None: model_data["display_order"] = display_order
        if stock is not None: model_data["stock"] = stock
        if is_available is not None: model_data["is_available"] = is_available
        if is_featured is not None: model_data["is_featured"] = is_featured
        
        if price is not None:
            try:
                price_float = float(price)
            except ValueError:
                raise HTTPException(status_code=400, detail="Price must be a valid number")
            
            if price_float < 0:
                raise HTTPException(status_code=400, detail="Price cannot be negative")
            
            model_data["price"] = price_float
        
        model = PhoneModelService.update_model(db, model_id, model_data)
        if not model:
            raise HTTPException(status_code=404, detail="Phone model not found")
        
        return {
            "success": True,
            "model": {
                "id": model.id,
                "name": model.name,
                "brand_id": model.brand_id,
                "price": float(model.price),
                "chinese_model_id": model.chinese_model_id,
                "display_order": model.display_order,
                "stock": model.stock,
                "is_available": model.is_available,
                "is_featured": model.is_featured
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update phone model: {str(e)}")

@router.delete("/api/admin/models/{model_id}")
async def delete_phone_model(model_id: str, db: Session = Depends(get_db)):
    """Delete phone model"""
    try:
        success = PhoneModelService.delete_model(db, model_id)
        if not success:
            raise HTTPException(status_code=404, detail="Phone model not found")
        
        return {"success": True, "message": "Phone model deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete phone model: {str(e)}")

@router.put("/api/admin/models/{model_id}/toggle-featured")
async def toggle_model_featured(model_id: str, db: Session = Depends(get_db)):
    """Toggle phone model featured status"""
    try:
        model = PhoneModelService.toggle_featured(db, model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Phone model not found")
        
        return {
            "success": True,
            "model": {
                "id": model.id,
                "name": model.name,
                "is_featured": model.is_featured
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle featured status: {str(e)}")

@router.put("/api/admin/templates/{template_id}/price")
async def update_template_price(
    template_id: str,
    price: float = Form(...),
    db: Session = Depends(get_db)
):
    """Update template price"""
    try:
        template = TemplateService.update_template_price(db, template_id, price)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {
            "success": True,
            "template": {
                "id": template.id,
                "name": template.name,
                "price": float(template.price),
                "display_price": template.display_price,
                "updated_at": template.updated_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update template price: {str(e)}")

@router.get("/api/admin/images")
async def get_admin_images(
    limit: int = 100,
    image_type: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Get all images for admin dashboard with order data"""
    try:
        # Apply relaxed security for all users accessing admin endpoints
        if request:
            # Use relaxed validation for all users
            validate_relaxed_api_security(request)
        
        images = OrderImageService.get_all_images_with_orders(db, limit, image_type)
        
        return {
            "success": True,
            "images": [
                {
                    "id": img.id,
                    "image_path": img.image_path,
                    "image_type": img.image_type,
                    "ai_params": img.ai_params,
                    "chinese_image_url": img.chinese_image_url,
                    "created_at": img.created_at.isoformat(),
                    "order": {
                        "id": img.order.id,
                        "brand": img.order.brand.name if img.order.brand else "Unknown",
                        "model": img.order.phone_model.name if img.order.phone_model else "Unknown",
                        "template": img.order.template.name if img.order.template else "Unknown",
                        "status": img.order.status,
                        "total_amount": float(img.order.total_amount) if img.order.total_amount else 0,
                        "created_at": img.order.created_at.isoformat()
                    } if img.order else None
                }
                for img in images
            ]
        }
    except Exception as e:
        print(f"Admin images error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get images: {str(e)}")

@router.get("/api/admin/template-analytics")
async def get_template_analytics(request: Request = None, db: Session = Depends(get_db)):
    """Get template usage analytics for admin dashboard"""
    try:
        # Apply relaxed security for all users accessing admin endpoints
        if request:
            # Use relaxed validation for all users
            validate_relaxed_api_security(request)
        
        analytics = OrderService.get_template_analytics(db)
        
        return {
            "success": True,
            "analytics": analytics
        }
    except Exception as e:
        print(f"Template analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get template analytics: {str(e)}")

@router.get("/api/admin/database-stats")
async def get_database_stats(request: Request = None, db: Session = Depends(get_db)):
    """Get database statistics for admin dashboard"""
    try:
        # Apply relaxed security for all users accessing admin endpoints
        if request:
            # Use relaxed validation for all users
            validate_relaxed_api_security(request)
        
        stats = OrderService.get_database_stats(db)
        
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        print(f"Database stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get database stats: {str(e)}")

@router.post("/api/orders/{order_id}/images")
async def add_order_image(
    order_id: str,
    image_path: str = Form(...),
    image_type: str = Form("generated"),
    ai_params: str = Form("{}"),  # JSON string
    db: Session = Depends(get_db)
):
    """Add image to order"""
    try:
        # Verify order exists
        order = OrderService.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Parse AI params
        try:
            ai_params_dict = json.loads(ai_params)
        except json.JSONDecodeError:
            ai_params_dict = {}
        
        image = OrderImageService.add_order_image(db, order_id, image_path, image_type, ai_params_dict)
        
        return {
            "success": True,
            "image": {
                "id": image.id,
                "order_id": image.order_id,
                "image_path": image.image_path,
                "image_type": image.image_type,
                "ai_params": image.ai_params,
                "created_at": image.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add image: {str(e)}")

# Image serving route (must be at root level, not under /api prefix)
@router.get("/image/{filename}")
async def serve_image(filename: str, token: str, request: Request):
    """Serve generated image with required token validation for secure access"""
    from backend.services.image_service import ensure_directories
    from backend.config.settings import JWT_SECRET_KEY
    from fastapi.responses import FileResponse
    import hmac
    import hashlib
    import time
    import logging
    
    # Set up logging
    logger = logging.getLogger(__name__)
    
    # Get client IP for logging
    client_ip = request.client.host if request.client else "unknown"
    
    generated_dir = ensure_directories()
    file_path = generated_dir / filename
    
    if not file_path.exists():
        logger.warning(f"Image access attempt failed - file not found: {filename} from IP: {client_ip}")
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Token is now REQUIRED for all access
    if not token:
        logger.warning(f"Image access attempt failed - no token provided for: {filename} from IP: {client_ip}")
        raise HTTPException(status_code=401, detail="Access token required for image access")
    
    # Validate the required token using enhanced validation
    try:
        from backend.services.file_service import validate_secure_token
        
        # Validate token using the enhanced validation service
        validation_result = validate_secure_token(token, filename)
        
        if not validation_result["valid"]:
            error_msg = validation_result.get("error", "Token validation failed")
            logger.warning(f"Image access attempt failed - {error_msg} for: {filename} from IP: {client_ip}")
            
            # Return appropriate HTTP status based on error type
            if "expired" in error_msg.lower():
                raise HTTPException(status_code=403, detail="Download token expired")
            elif "invalid" in error_msg.lower():
                raise HTTPException(status_code=403, detail="Invalid download token")
            else:
                raise HTTPException(status_code=400, detail=error_msg)
        
        # Log successful access with partner information
        partner_type = validation_result.get("partner_type", "unknown")
        time_remaining = validation_result.get("time_remaining_seconds", 0)
        logger.info(f"Image access granted for: {filename} from IP: {client_ip}, partner: {partner_type}, time remaining: {time_remaining}s")
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Image access validation error for: {filename} from IP: {client_ip}, error: {str(e)}")
        raise HTTPException(status_code=500, detail="Token validation error")
    
    return FileResponse(
        path=file_path,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
            "Access-Control-Allow-Origin": "*"  # Allow cross-origin requests for Chinese partners
        }
    )

