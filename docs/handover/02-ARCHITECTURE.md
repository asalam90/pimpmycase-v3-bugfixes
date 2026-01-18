# System Architecture - PimpMyCase Webstore

## High-Level Architecture

```
┌─────────────────┐
│  Mobile/Web     │
│  Browser        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────────┐
│  React SPA      │────→ │  FastAPI Backend │
│  (Vite)         │  API │  (Python)        │
└─────────────────┘      └────────┬─────────┘
                                  │
                 ┌────────────────┼───────────────┐
                 ↓                ↓               ↓
         ┌───────────────┐  ┌──────────┐  ┌─────────────┐
         │  PostgreSQL   │  │ Stripe   │  │  Chinese    │
         │  Database     │  │ Payment  │  │  API        │
         └───────────────┘  └──────────┘  └─────────────┘
                                                  │
                                                  ↓
                                          ┌──────────────┐
                                          │ Manufacturing│
                                          │ & Fulfillment│
                                          └──────────────┘
┌─────────────────┐
│ Vending Machine │
│ (QR Scanner)    │
└────────┬────────┘
         │
         └──────→ QR Session Flow
```

## Frontend Architecture (React SPA)

### Component Hierarchy

```
App.jsx (Router)
├── AppStateContext (Global State)
└── Screen Components (35 total)
    ├── LandingScreen
    ├── BrandModelSelectionScreen
    ├── TemplateSelectionScreen
    ├── CustomizeImageScreen
    ├── PhonePreviewScreen
    ├── AddStickersScreen
    ├── TextInputScreen
    ├── PaymentScreen
    └── ...more screens

Shared Components (7)
├── MaskedPhoneDisplay (phone case preview)
├── OptimizedDraggableSticker (touch drag)
├── OptimizedDraggableText (text drag)
├── CircleSubmitButton
└── TopNavBar
```

### State Management

**File**: `src/contexts/AppStateContext.jsx`

**Pattern**: React Context + Reducer

**Key State Properties**:
```javascript
{
  // Phone Selection
  brand: "iPhone",
  model: "iPhone 15 Pro",
  modelData: { width, height, chinese_model_id },

  // Template Selection
  template: { id, name, imageCount },

  // Images
  uploadedImages: [{ id, src, transform }],

  // Customization
  placedStickers: [{ id, x, y, scale, rotation }],
  customText: [{ text, font, color, position }],
  selectedBackgroundColor: "#ffffff",

  // Session Management
  vendingMachineSession: { sessionId, machineId },

  // Order Tracking
  currentOrder: { orderId, queueNumber }
}
```

**Persistence**: Automatic localStorage sync with size limits

### Routing Structure

**File**: `src/App.jsx`

36 routes defined:
- `/` - Landing
- `/qr` - QR entry point (vending)
- `/brand-model-selection` - Phone selection
- `/template-selection` - Template choice
- `/customize-image` - Image upload/crop
- `/phone-preview` - Preview with mask
- `/add-stickers` - Sticker placement
- `/text-input` - Text customization
- `/payment` - Checkout
- `/payment-success` - Order confirmation
- `/vending-payment-success` - Vending completion
- ...AI template routes...

### Key Utilities

#### phoneCaseLayout.js
- **Purpose**: Physical dimension calculations
- **Functions**:
  - `getMaskPosition(model)` - Camera cutout positioning
  - `getPhysicalDimensions(model)` - mm measurements
  - `calculateAspectRatio(model)` - Display ratios

#### finalImageComposer.js
- **Purpose**: Export-ready image generation
- **Canvas Resolution**: 1390px width (proportional height)
- **Process**:
  1. Create high-res canvas based on physical dimensions
  2. Apply background color
  3. Draw uploaded images with transforms
  4. Overlay stickers
  5. Render text elements
  6. Export as PNG data URL

#### stickerLoader.js
- **Purpose**: Sticker asset management
- **Categories**: 16 (ABSTRACT, ANIMAL_PRINT, CATS, etc.)
- **Loading**: Dynamic from `/public/Stickers/`
- **Caching**: In-memory asset preloading

## Backend Architecture (FastAPI)

### Layered Architecture

```
API Routes Layer (backend/routes/)
├── basic.py          # Health, root endpoints
├── image.py          # AI generation
├── payment.py        # Stripe checkout
├── vending.py        # Vending sessions
├── chinese_api.py    # Manufacturing integration
├── admin.py          # Admin dashboard
└── stickers.py       # Sticker management

Service Layer (backend/services/)
├── ai_service.py              # Google Gemini integration
├── chinese_api_service.py     # Chinese API client
├── chinese_payment_service.py # Payment flow
├── payment_service.py         # Stripe initialization
├── image_service.py           # Image processing
├── file_service.py            # Secure file URLs
└── r2_service.py              # Cloudflare R2

Data Layer (root level)
├── models.py         # SQLAlchemy ORM models
├── database.py       # DB connection
└── db_services.py    # Data access layer

Middleware
├── security_middleware.py    # Rate limiting, validation
└── backend/middleware/exception_handlers.py
```

### Database Models

**File**: `models.py`

**Core Models**:

1. **Brand**: Phone manufacturers
   ```python
   id, display_name, chinese_id
   ```

2. **PhoneModel**: Individual phone models
   ```python
   id, brand_id, display_name, width, height,
   chinese_model_id, mobile_shell_id
   ```

3. **Template**: Design templates
   ```python
   id, name, category, imageCount, price
   ```

4. **Order**: Customer orders
   ```python
   id, status, total_amount, brand_id, model_id,
   template_id, customer_name, customer_email,
   stripe_session_id, chinese_order_id,
   queue_number, created_at
   ```

5. **OrderImage**: Order design images
   ```python
   id, order_id, image_path, image_type
   ```

6. **VendingMachineSession**: QR sessions
   ```python
   id, session_id, machine_id, status, expires_at,
   user_registration_data, order_summary, payment_amount
   ```

7. **PaymentMapping**: Chinese API payment tracking
   ```python
   id, third_id, chinese_payment_id, stripe_session_id,
   status, created_at
   ```

### API Flow Patterns

#### E-Commerce Order Flow
```
1. Frontend: POST /create-checkout-session
   ↓
2. Backend: Create pending Order in database
   ↓
3. Backend: Create Stripe checkout session
   ↓
4. Frontend: Redirect to Stripe
   ↓
5. User: Complete payment
   ↓
6. Stripe: Redirect to /payment-success
   ↓
7. Frontend: POST /process-payment-success
   ↓
8. Backend:
   - Update Order status to "paid"
   - Send payment to Chinese API
   - Submit order data to Chinese API
   - Return queue number
```

#### Vending Machine Flow
```
1. Vending: Generate QR code with session_id
   ↓
2. User: Scan QR → Frontend /qr?session_id=xxx
   ↓
3. Frontend: POST /api/vending/session/{id}/register-user
   ↓
4. User: Customize phone case
   ↓
5. Frontend: POST /api/vending/session/{id}/order-summary
   ↓
6. Backend: Calculate price, store in session
   ↓
7. Frontend: POST /api/vending/session/{id}/init-payment
   ↓
8. Backend:
   - Create Order in database
   - Send payment to Chinese API (pay_type: 10)
   - Return payment details
   ↓
9. Vending: Process payment via hardware
   ↓
10. Vending: POST /api/vending/session/{id}/confirm-payment
   ↓
11. Backend:
    - Send payment status to Chinese API
    - Submit order data
    - Print case
```

## Data Flow Diagrams

### Image Generation Flow

```
User Upload
    ↓
Frontend: File → Data URL
    ↓
AI Template?
    ├─ Yes → POST /api/images/generate
    │         ↓
    │       Google Gemini API
    │         ↓
    │       AI-transformed image
    ↓
finalImageComposer.js
    ↓
High-res PNG (1390px width)
    ↓
Upload to R2 (optional)
    ↓
Generate authenticated URL
    ↓
Send to Chinese API for printing
```

### Session Management

**QR Sessions** (30-minute expiry):
- Created by vending machine
- Tracked in `VendingMachineSession` table
- Automatic cleanup of expired sessions
- State stored in `user_registration_data` JSON field

**E-Commerce Sessions**:
- Managed by localStorage on frontend
- Linked to Stripe session ID
- Order created before payment ("pending_payment" status)

## Security Architecture

### Authentication
- **Admin**: JWT tokens with bcrypt password hashing
- **Users**: Session-based (no login required)
- **API Partners**: HMAC signature verification (Chinese API)

### Authorization
- **Admin Endpoints**: JWT middleware
- **Public Endpoints**: Rate limiting only
- **Vending Endpoints**: Session validation

### Data Protection
- **Environment Variables**: `.env` files (gitignored)
- **Secrets**: Never in codebase
- **Database**: Encrypted connections (PostgreSQL SSL)
- **Files**: Secure signed URLs with expiry
- **CORS**: Whitelist of allowed origins

### Rate Limiting
**File**: `security_middleware.py`
- Default: 100 requests/minute per IP
- Image generation: 10 requests/minute
- Session creation: 20 requests/minute

## Integration Points

### Chinese Manufacturing API

**Base URL**: `https://api.inkele.net/mobileShell/en`

**Authentication**: HMAC signature
```python
signature = md5(sorted_params + fixed_key)
```

**Key Endpoints Used**:
- `POST /third/brand/list` - Get brands
- `POST /third/device/stock` - Check stock
- `POST /third/payment/data` - Submit payment
- `POST /third/payment/changeStatus` - Update payment status
- `POST /third/order/data` - Submit order for printing

### Stripe Integration

**Mode**: Checkout Sessions

**Webhook Events** (future):
- `checkout.session.completed`
- `payment_intent.succeeded`

**Metadata Tracking**:
- Order details stored in session metadata
- Retrieved on success callback

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based
- **Image Optimization**: WebP format for backgrounds
- **Lazy Loading**: Component-based
- **Service Worker**: Offline capability
- **LocalStorage**: State persistence to reduce re-renders

### Backend Optimization
- **Connection Pooling**: SQLAlchemy pool
- **Async Operations**: FastAPI async/await
- **Caching**: In-memory for phone models
- **Image Processing**: Server-side with PIL

### Database Optimization
- **Indexes**: On foreign keys and frequently queried fields
- **Query Optimization**: JOINs minimized
- **Connection Management**: Pool size limits

## Deployment Architecture

### Production Environment

**Frontend** (Hostinger):
- Static hosting of React build
- CDN for global delivery
- Custom domain: `pimpmycase.co.uk`

**Backend** (Render):
- Web service with auto-scaling
- PostgreSQL managed database
- Custom domain: `pimpmycase-webstore.onrender.com`
- Environment variables managed in dashboard

**Assets**:
- Stickers: Deployed with frontend (`/public/Stickers/`)
- Generated Images: Cloudflare R2 (optional) or local storage

### Development Environment

**Frontend**: `localhost:5173` (Vite dev server)
**Backend**: `localhost:8000` (Uvicorn)
**Database**: SQLite (`local_dev.db`)

## Error Handling Strategy

### Frontend
- User-friendly error messages
- Fallback UI for failed image loads
- Retry logic for API calls
- Toast notifications for errors

### Backend
- Structured error responses
- HTTP status codes (400, 404, 500)
- Detailed logging
- Graceful degradation (Chinese API failures don't block orders)

---

**Next**: See `03-SETUP-GUIDE.md` for installation instructions.
