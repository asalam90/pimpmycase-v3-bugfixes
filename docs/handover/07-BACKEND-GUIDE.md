# Backend Guide - PimpMyCase Webstore

## Quick Reference

- **Framework**: FastAPI 0.109
- **Language**: Python 3.10+
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL (prod) / SQLite (dev)
- **Server**: Uvicorn ASGI
- **Entry Point**: `api_server.py`

## Directory Structure

```
Backend Architecture:
api_server.py                    # FastAPI app entry point
database.py                      # SQLAlchemy configuration
models.py                        # ORM models
db_services.py                   # Data access layer
security_middleware.py           # Rate limiting

backend/
├── routes/                      # API endpoints
│   ├── __init__.py             # Router aggregation
│   ├── basic.py                # Health, root
│   ├── image.py                # AI generation
│   ├── payment.py              # Stripe checkout
│   ├── vending.py              # Vending sessions (50KB)
│   ├── chinese_api.py          # Manufacturing (112KB - largest)
│   ├── admin.py                # Admin dashboard
│   └── stickers.py             # Sticker endpoints
├── services/                    # Business logic
│   ├── ai_service.py           # Google Gemini
│   ├── chinese_api_service.py  # Chinese API client
│   ├── chinese_payment_service.py
│   ├── payment_service.py      # Stripe
│   ├── image_service.py        # Image processing
│   ├── file_service.py         # Secure URLs
│   └── r2_service.py           # Cloudflare R2
├── schemas/                     # Pydantic models
│   ├── base.py
│   ├── payment.py
│   ├── vending.py
│   └── chinese_api.py
├── config/                      # Configuration
│   ├── settings.py             # App settings
│   └── cors.py                 # CORS origins
├── middleware/                  # Middleware
│   └── exception_handlers.py   # Error handling
└── utils/                       # Utilities
    └── helpers.py              # Helper functions
```

## FastAPI Application (api_server.py)

### Application Setup

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config.cors import ALLOWED_ORIGINS

app = FastAPI(
    title="PimpMyCase API",
    description="Custom phone case design and ordering API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register routes
from backend.routes import router
app.include_router(router)
```

### Running the Server

```bash
# Development (with auto-reload)
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000

# Production
python api_server.py
```

## Database Models (models.py)

### Core Models

#### Brand
```python
class Brand(Base):
    __tablename__ = "brands"
    id = Column(String, primary_key=True)          # 'apple', 'samsung'
    display_name = Column(String, nullable=False)   # 'iPhone', 'Samsung'
    chinese_id = Column(String)                     # Chinese API brand ID
    phone_models = relationship("PhoneModel")
```

#### PhoneModel
```python
class PhoneModel(Base):
    __tablename__ = "phone_models"
    id = Column(String, primary_key=True)          # 'iphone-15-pro'
    brand_id = Column(String, ForeignKey("brands.id"))
    display_name = Column(String, nullable=False)   # 'iPhone 15 Pro'
    width = Column(Float)                          # Physical width (mm)
    height = Column(Float)                         # Physical height (mm)
    chinese_model_id = Column(String)              # Chinese API model ID
    mobile_shell_id = Column(String)               # Shell type ID
```

#### Order
```python
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    status = Column(String)                        # 'pending_payment', 'paid', 'sent_to_chinese'
    total_amount = Column(Float)
    brand_id = Column(String, ForeignKey("brands.id"))
    model_id = Column(String, ForeignKey("phone_models.id"))
    template_id = Column(String)
    customer_name = Column(String)
    customer_email = Column(String)
    stripe_session_id = Column(String)
    chinese_order_id = Column(String)
    queue_number = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### VendingMachineSession
```python
class VendingMachineSession(Base):
    __tablename__ = "vending_machine_sessions"
    id = Column(Integer, primary_key=True)
    session_id = Column(String, unique=True)
    machine_id = Column(String)
    status = Column(String)                        # 'active', 'expired', 'completed'
    user_registration_data = Column(JSON)          # User details
    order_summary = Column(JSON)                   # Order data
    payment_amount = Column(Float)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Database Connection (database.py)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./local_dev.db')

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Route Modules

### Payment Routes (backend/routes/payment.py)

```python
from fastapi import APIRouter, Depends
from backend.schemas.payment import CheckoutSessionRequest

router = APIRouter()

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CheckoutSessionRequest,
    db: Session = Depends(get_db)
):
    # 1. Create pending order in database
    order = Order(status="pending_payment", ...)
    db.add(order)
    db.commit()

    # 2. Create Stripe checkout session
    session = stripe.checkout.Session.create(...)

    # 3. Link Stripe session to order
    order.stripe_session_id = session.id
    db.commit()

    return {"checkout_url": session.url, "session_id": session.id}
```

### Vending Routes (backend/routes/vending.py)

```python
@router.post("/session/{session_id}/init-payment")
async def init_vending_payment(session_id: str, db: Session = Depends(get_db)):
    # 1. Get session
    session = db.query(VendingMachineSession).filter_by(session_id=session_id).first()

    # 2. Create order
    order = Order(...)
    db.add(order)
    db.commit()

    # 3. Send payment to Chinese API
    from backend.services.chinese_payment_service import send_payment_to_chinese_api
    result = send_payment_to_chinese_api(
        mobile_model_id=model.chinese_model_id,
        device_id=session.machine_id,
        pay_amount=session.payment_amount,
        pay_type=10  # Vending machine payment
    )

    return {"chinese_payment_id": result['data']['id']}
```

## Service Layer

### Chinese API Service (backend/services/chinese_api_service.py)

```python
import hashlib
import requests

def generate_signature(params: dict, fixed_key: str) -> str:
    """Generate HMAC signature for Chinese API"""
    sorted_params = ''.join([f"{k}{v}" for k, v in sorted(params.items())])
    signature_string = sorted_params + fixed_key
    return hashlib.md5(signature_string.encode()).hexdigest()

def send_request(endpoint: str, data: dict) -> dict:
    """Send signed request to Chinese API"""
    data['account'] = CHINESE_API_ACCOUNT
    data['password'] = CHINESE_API_PASSWORD
    data['sign'] = generate_signature(data, CHINESE_API_FIXED_KEY)

    response = requests.post(
        f"{CHINESE_API_BASE_URL}/{endpoint}",
        json=data
    )
    return response.json()
```

### AI Service (backend/services/ai_service.py)

```python
import google.generativeai as genai

genai.configure(api_key=GOOGLE_API_KEY)

async def generate_ai_image(image_data: str, style: str) -> str:
    """Generate AI-transformed image"""
    from ai_prompts import AI_STYLE_PROMPTS

    model = genai.GenerativeModel('gemini-pro-vision')
    prompt = AI_STYLE_PROMPTS.get(style, "Transform the image")

    response = await model.generate_content_async([prompt, image_data])

    # Save generated image
    image_path = f"generated-images/{style}_{timestamp}.png"
    save_image(response.image, image_path)

    return image_path
```

## Pydantic Schemas (backend/schemas/)

### Request/Response Validation

```python
from pydantic import BaseModel, EmailStr

class CheckoutSessionRequest(BaseModel):
    amount_pence: int
    template_id: str
    brand: str
    model: str
    customer_email: Optional[EmailStr] = None
    customer_name: Optional[str] = None
    final_image_url: Optional[str] = None

class OrderResponse(BaseModel):
    order_id: int
    queue_no: str
    status: str
    chinese_order_id: Optional[str]

    class Config:
        from_attributes = True  # SQLAlchemy model compatibility
```

## Middleware

### Security Middleware (security_middleware.py)

```python
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)

    def check_rate_limit(self, ip: str, limit: int = 100):
        """Check if IP exceeds rate limit"""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)

        # Clean old requests
        self.requests[ip] = [
            req_time for req_time in self.requests[ip]
            if req_time > minute_ago
        ]

        if len(self.requests[ip]) >= limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        self.requests[ip].append(now)
```

## Error Handling

### Exception Handlers (backend/middleware/exception_handlers.py)

```python
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

## Adding a New Endpoint

1. **Create route function**:
```python
# backend/routes/my_route.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/my-endpoint")
async def my_endpoint():
    return {"message": "Hello"}
```

2. **Register router** in `backend/routes/__init__.py`:
```python
from .my_route import router as my_router

router.include_router(my_router, prefix="/api")
```

3. **Test**: Visit `/docs` and try the new endpoint

## Database Operations

### Query Examples

```python
# Get all orders
orders = db.query(Order).all()

# Filter by status
paid_orders = db.query(Order).filter(Order.status == "paid").all()

# Join with relationships
orders_with_models = db.query(Order).join(PhoneModel).all()

# Create new record
new_order = Order(status="pending", total_amount=35.00)
db.add(new_order)
db.commit()
db.refresh(new_order)  # Get ID

# Update record
order.status = "paid"
db.commit()

# Delete record
db.delete(order)
db.commit()
```

## Testing

### Manual Testing

```bash
# Test with cURL
curl http://localhost:8000/health

# Test with Python requests
import requests
response = requests.post("http://localhost:8000/api/endpoint", json={...})
print(response.json())
```

---

**Next**: See `08-DEPLOYMENT.md` for production deployment.
