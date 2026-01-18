"""Payment-related Pydantic models"""

from pydantic import BaseModel, EmailStr
from typing import Optional

class CheckoutSessionRequest(BaseModel):
    # Payment details
    amount: Optional[float] = None  # Legacy field - kept for backward compatibility
    amount_pence: Optional[int] = None  # CRITICAL FIX: New field for precise pence amounts

    # Product selection
    template_id: str
    brand: str
    model: str
    color: str
    design_image: Optional[str] = None
    final_image_url: Optional[str] = None  # CRITICAL FIX: Final uploaded image URL for Chinese API
    order_id: Optional[str] = None

    # Entry source tracking
    entry_source: Optional[str] = None  # 'qr' | 'vanilla'
    machine_id: Optional[str] = None  # For QR entries
    is_machine_collection: Optional[bool] = False  # Flag for machine collection vs delivery

    # E-COMMERCE: Customer Information (Required for standalone e-commerce)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None  # Will be validated as email if provided
    customer_phone: Optional[str] = None
    shipping_address_line1: Optional[str] = None
    shipping_address_line2: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postcode: Optional[str] = None
    shipping_country: Optional[str] = "United Kingdom"
    customer_notes: Optional[str] = None

class PaymentSuccessRequest(BaseModel):
    session_id: str
    order_data: dict
    final_image_url: Optional[str] = None  # URL to final design image