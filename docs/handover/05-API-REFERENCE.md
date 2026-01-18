# API Reference - PimpMyCase Webstore

## Base URLs

- **Production**: `https://pimpmycase-webstore.onrender.com`
- **Development**: `http://localhost:8000`
- **API Documentation**: `/docs` (Swagger UI)
- **Alternative Docs**: `/redoc` (ReDoc)

## Authentication

Most endpoints are public. Admin endpoints require JWT token:

```http
Authorization: Bearer <jwt_token>
```

## Core Endpoints

### Health & Status

#### GET /health
Check API health status.

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "chinese_api": "reachable"
}
```

#### GET /api/database/stats
Get database statistics (admin).

**Response**:
```json
{
  "orders": 150,
  "phone_models": 48,
  "brands": 3
}
```

### Image Generation

#### POST /api/images/generate
Generate AI-transformed image.

**Request**:
```json
{
  "image_data": "data:image/png;base64,...",
  "style": "funny-toon",
  "quality": "standard",
  "size": "1024x1024"
}
```

**Response**:
```json
{
  "image_url": "https://storage.../generated_xxx.png",
  "generation_id": "gen_12345"
}
```

#### GET /image/{filename}
Serve generated image file.

**Parameters**:
- `filename`: Image filename

**Response**: Image file (PNG/JPEG)

### Payment (Stripe)

#### POST /create-checkout-session
Create Stripe checkout session.

**Request**:
```json
{
  "amount_pence": 3500,
  "template_id": "classic",
  "brand": "iPhone",
  "model": "iPhone 15 Pro",
  "color": "Natural Titanium",
  "final_image_url": "https://...",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "shipping_address_line1": "123 Main St",
  "shipping_city": "London",
  "shipping_postcode": "SW1A 1AA",
  "shipping_country": "United Kingdom"
}
```

**Response**:
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_..."
}
```

#### POST /process-payment-success
Process successful Stripe payment.

**Request**:
```json
{
  "session_id": "cs_test_..."
}
```

**Response**:
```json
{
  "success": true,
  "order_id": 123,
  "queue_no": "PMC-00123",
  "status": "paid",
  "chinese_order_id": "CHN123456"
}
```

### Vending Machine

#### POST /api/vending/create-session
Create vending machine session.

**Request**:
```json
{
  "machine_id": "JMSOOMSZRQO9",
  "timeout_minutes": 30
}
```

**Response**:
```json
{
  "session_id": "vs_abc123",
  "qr_code_url": "/qr?session_id=vs_abc123",
  "expires_at": "2024-12-30T12:30:00Z"
}
```

#### GET /api/vending/session/{session_id}/status
Get session status.

**Response**:
```json
{
  "session_id": "vs_abc123",
  "status": "active",
  "user_registered": true,
  "order_summary": {...},
  "expires_at": "2024-12-30T12:30:00Z"
}
```

#### POST /api/vending/session/{session_id}/register-user
Register user QR scan.

**Request**:
```json
{
  "user_id": "user123",
  "device_info": {...}
}
```

**Response**:
```json
{
  "success": true,
  "session_id": "vs_abc123"
}
```

#### POST /api/vending/session/{session_id}/order-summary
Submit order details.

**Request**:
```json
{
  "brand": "iPhone",
  "model": "iPhone 15 Pro",
  "template_id": "classic",
  "final_image_url": "https://...",
  "price": 35.00
}
```

**Response**:
```json
{
  "success": true,
  "payment_amount": 35.00
}
```

#### POST /api/vending/session/{session_id}/init-payment
Initialize payment with Chinese API.

**Request**:
```json
{
  "order_data": {
    "mobile_model_id": "MODEL123",
    "mobile_shell_id": "MS_001"
  }
}
```

**Response**:
```json
{
  "chinese_payment_id": "PAY123456",
  "third_id": "PYEN20241230123456",
  "payment_amount": 35.00,
  "order_id": 123
}
```

### Chinese API Integration

#### GET /api/chinese/brands
Get phone brands from Chinese API.

**Response**:
```json
{
  "code": 200,
  "data": [
    {"id": "1", "name": "Apple"},
    {"id": "2", "name": "Samsung"}
  ]
}
```

#### GET /api/chinese/stock/{device_id}/{brand_id}
Get available models for device and brand.

**Parameters**:
- `device_id`: Vending machine ID
- `brand_id`: Brand ID from Chinese API

**Response**:
```json
{
  "code": 200,
  "data": {
    "models": [
      {
        "id": "MODEL123",
        "name": "iPhone 15 Pro",
        "stock": 10
      }
    ]
  }
}
```

### Admin

#### GET /api/admin/orders
List all orders (requires auth).

**Query Parameters**:
- `status`: Filter by status
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset

**Response**:
```json
{
  "orders": [
    {
      "id": 123,
      "status": "paid",
      "queue_number": "PMC-00123",
      "created_at": "2024-12-30T10:00:00Z",
      "total_amount": 35.00
    }
  ],
  "total": 150
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Successful request |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid auth token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Default | 100 requests/minute |
| `/api/images/generate` | 10 requests/minute |
| `/api/vending/create-session` | 20 requests/minute |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Stripe Webhook (Future Implementation)

**Endpoint**: `/webhook/stripe`

**Events**:
- `checkout.session.completed`
- `payment_intent.succeeded`

**Signature Verification**: Required

## File Upload Endpoints

### POST /upload/design
Upload design image (future).

**Content-Type**: `multipart/form-data`

**Fields**:
- `file`: Image file (max 10MB)
- `order_id`: Associated order ID

## Testing

### Using Swagger UI

1. Visit `/docs`
2. Click "Try it out" on any endpoint
3. Fill in parameters
4. Click "Execute"

### Using cURL

```bash
# Health check
curl http://localhost:8000/health

# Generate AI image
curl -X POST http://localhost:8000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{"image_data":"...","style":"funny-toon"}'

# Create checkout session
curl -X POST http://localhost:8000/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"amount_pence":3500,"template_id":"classic",...}'
```

## API Versioning

Currently: **v1** (implicit)

Future versions will use `/v2/` prefix.

---

**Next**: See `06-FRONTEND-GUIDE.md` for frontend architecture.
