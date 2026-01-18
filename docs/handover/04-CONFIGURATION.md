# Configuration Guide - PimpMyCase Webstore

## Configuration Files Overview

| File | Purpose | Location |
|------|---------|----------|
| `.env` | Backend environment variables | Root directory |
| `.env.local` | Frontend environment variables | Root directory |
| `backend/config/settings.py` | Backend settings | Backend config |
| `backend/config/cors.py` | CORS configuration | Backend config |
| `src/config/environment.js` | Frontend environment | Frontend config |
| `src/config/templatePricing.js` | Template pricing | Frontend config |

## Backend Configuration

### Environment Variables (.env)

#### Database Configuration

**SQLite (Development)**:
```env
DATABASE_URL=sqlite:///./local_dev.db
```

**PostgreSQL (Production)**:
```env
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
```

Format breakdown:
- `postgresql://` - Database type
- `username:password` - Credentials
- `hostname:5432` - Host and port
- `/database_name` - Database name

#### Security Settings

**JWT Secret Key**:
```env
JWT_SECRET_KEY=your-256-bit-secret-key-here
```

Generation:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Admin Credentials**:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$... # bcrypt hash
```

Generate hash:
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("your-password"))
```

#### API Integrations

**Google Gemini AI**:
```env
GOOGLE_API_KEY=AIza...
```

Obtain from: https://makersuite.google.com/app/apikey

**Stripe Payment**:
```env
STRIPE_SECRET_KEY=sk_test_...  # Testing
# STRIPE_SECRET_KEY=sk_live_... # Production
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Obtain from: https://dashboard.stripe.com/apikeys

**Chinese Manufacturing API**:
```env
CHINESE_API_BASE_URL=https://api.inkele.net/mobileShell/en
CHINESE_API_ACCOUNT=your-account-id
CHINESE_API_PASSWORD=your-api-password
CHINESE_API_FIXED_KEY=your-signature-key
CHINESE_API_DEVICE_ID=JMSOOMSZRQO9  # Default vending machine
```

Contact Chinese partner for credentials.

#### Cloud Storage (Optional)

**Cloudflare R2**:
```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=pimpmycase-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Create at: https://dash.cloudflare.com/r2

#### Application URLs

**API Base URL** (your backend domain):
```env
API_BASE_URL=https://pimpmycase-webstore.onrender.com
```

**Frontend URL** (your frontend domain):
```env
FRONTEND_URL=https://pimpmycase.co.uk
```

### Backend Settings (settings.py)

**File**: `backend/config/settings.py`

```python
import os

# API Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Chinese API
CHINESE_API_BASE_URL = os.getenv('CHINESE_API_BASE_URL')
CHINESE_API_ACCOUNT = os.getenv('CHINESE_API_ACCOUNT')
CHINESE_API_PASSWORD = os.getenv('CHINESE_API_PASSWORD')
CHINESE_API_FIXED_KEY = os.getenv('CHINESE_API_FIXED_KEY')
CHINESE_API_DEVICE_ID = os.getenv('CHINESE_API_DEVICE_ID', 'JMSOOMSZRQO9')

# Session Configuration
SESSION_TIMEOUT_MINUTES = 30  # Vending machine sessions
SESSION_CLEANUP_INTERVAL = 300  # 5 minutes

# Image Configuration
MAX_IMAGE_SIZE_MB = 10
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
GENERATED_IMAGES_DIR = './generated-images'

# Rate Limiting
RATE_LIMIT_DEFAULT = 100  # requests per minute
RATE_LIMIT_IMAGE_GEN = 10  # AI generation requests per minute
```

### CORS Configuration (cors.py)

**File**: `backend/config/cors.py`

```python
ALLOWED_ORIGINS = [
    "http://localhost:5173",          # Local development
    "http://localhost:5174",          # Admin dashboard dev
    "https://pimpmycase.co.uk",      # Production frontend
    "https://admin.pimpmycase.co.uk" # Production admin
]
```

**To add new origin**:
1. Add URL to `ALLOWED_ORIGINS` list
2. Restart backend server
3. Verify CORS headers in browser Network tab

## Frontend Configuration

### Environment Variables (.env.local)

**Development**:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=local
```

**Production** (build-time only):
```env
VITE_API_BASE_URL=https://pimpmycase-webstore.onrender.com
VITE_APP_ENV=production
```

**Note**: Vite injects these at build time. Change `.env.local` and rebuild for changes to take effect.

### Environment Config (environment.js)

**File**: `src/config/environment.js`

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const APP_ENV = import.meta.env.VITE_APP_ENV || 'local'

export const config = {
  apiBaseUrl: API_BASE_URL,
  environment: APP_ENV,
  isProduction: APP_ENV === 'production',
  isDevelopment: APP_ENV === 'local'
}
```

### Template Pricing Configuration

**File**: `src/config/templatePricing.js`

```javascript
export const TEMPLATE_PRICING = {
  'classic': {
    pricePence: 3500, // £35.00
    priceDisplay: 35.00,
    currency: '£',
    category: 'basic'
  },
  'funny-toon': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'ai'
  },
  // ... more templates
}
```

**To update pricing**:
1. Edit `pricePence` (amount in pence, e.g., 3500 = £35.00)
2. Update `priceDisplay` to match (for display only)
3. Rebuild frontend: `npm run build`

## Template Configuration

Templates are defined in the database `templates` table:

```sql
INSERT INTO templates (id, name, category, image_count, price) VALUES
  ('classic', 'Classic', 'basic', 1, 35.00),
  ('funny-toon', 'Funny Toon', 'ai', 1, 35.00),
  ('2-in-1', '2-in-1 Collage', 'basic', 2, 35.00),
  ('3-in-1', '3-in-1 Collage', 'basic', 3, 35.00),
  ('4-in-1', '4-in-1 Collage', 'basic', 4, 35.00);
```

**To add new template**:
1. Add to database `templates` table
2. Add pricing to `src/config/templatePricing.js`
3. Create template screen component (if AI)
4. Add route to `src/App.jsx`

## Font Configuration

**File**: `src/utils/fontManager.js`

Fonts are loaded from Google Fonts and local files:

```javascript
export const fonts = [
  { name: 'Arial', family: 'Arial', category: 'sans-serif' },
  { name: 'Helvetica', family: 'Helvetica', category: 'sans-serif' },
  { name: 'Comic Sans MS', family: 'Comic Sans MS', category: 'display' },
  // ... 16 total fonts
]
```

**To add new font**:
1. Add font to `public/fonts/` (if custom)
2. Import in `src/styles/fonts.css`
3. Add entry to `fontManager.js` fonts array
4. Font will appear in font selection screen

## Sticker Configuration

Stickers are organized in categories in `public/Stickers/`:

```
public/Stickers/
├── ABSTRACT/
├── ANIMAL_PRINT/
├── CATS/
├── DOGS/
├── FLORAL/
├── ... (16 categories total)
```

**To add new stickers**:
1. Add image files to appropriate category folder
2. Stickers are auto-discovered by `stickerLoader.js`
3. Supported formats: PNG, SVG, WebP

**To add new category**:
1. Create folder in `public/Stickers/`
2. Add sticker images
3. Category name is folder name (auto-detected)

## Phone Model Configuration

Phone models are synchronized from Chinese API:

```bash
python populate_phones.py
```

This script:
- Fetches brands and models from Chinese API
- Maps to internal IDs
- Stores physical dimensions (width/height in mm)

**To add new phone model manually**:

```sql
-- Add brand (if new)
INSERT INTO brands (id, display_name, chinese_id)
VALUES ('apple', 'iPhone', 'APPLE_BRAND_ID');

-- Add model
INSERT INTO phone_models (
  id, brand_id, display_name,
  width, height,
  chinese_model_id, mobile_shell_id
) VALUES (
  'iphone-16-pro', 'apple', 'iPhone 16 Pro',
  74.42, 150.96,  -- Physical dimensions in mm
  'CHINESE_MODEL_ID', 'MS_12345'
);
```

## Security Configuration

### Rate Limiting

**File**: `security_middleware.py`

```python
# Default rate limits (requests per minute)
DEFAULT_RATE_LIMIT = 100
IMAGE_GENERATION_LIMIT = 10
SESSION_CREATION_LIMIT = 20
```

**To adjust limits**:
Edit `security_middleware.py` and restart server.

### CORS (Cross-Origin Resource Sharing)

**File**: `backend/config/cors.py`

Add allowed origins:
```python
ALLOWED_ORIGINS = [
    "https://your-new-domain.com"
]
```

### Content Security Policy

Currently not enforced. For enhanced security, add CSP headers:

```python
# In api_server.py
from fastapi.middleware.security import HTTPSRedirectMiddleware

app.add_middleware(
    ContentSecurityPolicyMiddleware,
    policy="default-src 'self'; img-src * data:; script-src 'self' 'unsafe-inline'"
)
```

## Logging Configuration

**File**: `api_server.py`

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pimpmycase_api.log'),
        logging.StreamHandler()
    ]
)
```

**Log levels**:
- `DEBUG`: Development debugging
- `INFO`: Production (recommended)
- `WARNING`: Important warnings only
- `ERROR`: Errors only

**To change log level**:
Edit `level=logging.INFO` to desired level and restart.

## Session Configuration

**Vending Machine Sessions**:
- Timeout: 30 minutes (configurable in `backend/config/settings.py`)
- Cleanup: Automatic every 5 minutes
- Storage: Database (`vending_machine_sessions` table)

**E-Commerce Sessions**:
- Storage: Browser localStorage
- Persistence: Until user clears browser data
- Size limit: 5MB (enforced by browser)

## Image Generation Configuration

**AI Prompts**:
**File**: `ai_prompts.py`

```python
AI_STYLE_PROMPTS = {
    'funny-toon': "Transform into a vibrant cartoon...",
    'retro-remix': "Apply retro vintage filter...",
    'glitch-pro': "Add glitch art effects...",
    # ... more styles
}
```

**Canvas Resolution**:
**File**: `src/utils/finalImageComposer.js`

```javascript
const CANVAS_WIDTH = 1390  // Fixed width in pixels
// Height calculated based on phone model physical aspect ratio
```

**To change resolution**:
Edit `CANVAS_WIDTH` (height auto-calculated from phone dimensions).

## Build Configuration

### Vite (Frontend)

**File**: `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,  // Enable for debugging: true
    minify: 'terser'
  }
})
```

### Tailwind CSS

**File**: `tailwind.config.js`

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B9D',  // Custom pink
      }
    },
  },
  plugins: [],
}
```

## Production vs Development

| Setting | Development | Production |
|---------|-------------|------------|
| Database | SQLite | PostgreSQL |
| API URL | `localhost:8000` | `pimpmycase-webstore.onrender.com` |
| Frontend URL | `localhost:5173` | `pimpmycase.co.uk` |
| Stripe Key | `sk_test_...` | `sk_live_...` |
| Logging | DEBUG | INFO |
| Source Maps | Enabled | Disabled |
| Minification | Disabled | Enabled |

---

**Next**: See `05-API-REFERENCE.md` for API endpoint documentation.
