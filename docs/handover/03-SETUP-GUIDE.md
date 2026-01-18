# Setup Guide - PimpMyCase Webstore

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Python**: v3.10 or higher
- **pip**: v21.0 or higher
- **PostgreSQL**: v14+ (production) or SQLite (development)
- **Git**: v2.30 or higher

### Required Accounts
- **Google Cloud Platform**: For Gemini AI API
- **Stripe**: For payment processing
- **Chinese Manufacturing Partner**: API credentials
- **Cloudflare** (optional): For R2 storage

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pimpmycase-webstore
```

### 2. Frontend Setup

#### Install Dependencies
```bash
npm install
```

#### Create Environment File
```bash
cp .env.example .env.local
```

#### Configure Environment Variables
Edit `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=local
```

#### Start Development Server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

#### Build for Production
```bash
npm run build
```

Build output will be in the `dist/` directory.

### 3. Backend Setup

#### Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Dependencies
```bash
pip install -r requirements-api.txt
```

#### Create Environment File
```bash
cp env.example .env
```

#### Configure Environment Variables
Edit `.env` with your actual credentials:

```env
# Database
DATABASE_URL=sqlite:///./local_dev.db  # For development
# DATABASE_URL=postgresql://user:pass@localhost/pimpmycase  # For production

# Security
JWT_SECRET_KEY=<generate-a-secure-256-bit-key>

# Google AI
GOOGLE_API_KEY=<your-google-api-key>

# Stripe
STRIPE_SECRET_KEY=<your-stripe-secret-key>

# Chinese API
CHINESE_API_BASE_URL=https://api.inkele.net/mobileShell/en
CHINESE_API_ACCOUNT=<your-account>
CHINESE_API_PASSWORD=<your-password>
CHINESE_API_FIXED_KEY=<your-fixed-key>
CHINESE_API_DEVICE_ID=<default-device-id>

# URLs
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

#### Initialize Database

For SQLite (development):
```bash
python -c "from database import create_tables; create_tables()"
```

For PostgreSQL (production):
```bash
# Create database
createdb pimpmycase

# Run migrations
psql -d pimpmycase -f init_database.sql
```

#### Populate Phone Models
```bash
python populate_phones.py
```

#### Start API Server
```bash
python api_server.py
```

API will be available at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### 4. Admin Dashboard Setup (Optional)

```bash
cd admin-dashboard
npm install
npm run dev
```

Admin dashboard will be at: `http://localhost:5174`

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | `postgresql://user:pass@host/db` |
| `JWT_SECRET_KEY` | Secret for JWT tokens | Yes | Random 256-bit string |
| `GOOGLE_API_KEY` | Google Gemini API key | Yes | `AIza...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes | `sk_test_...` or `sk_live_...` |
| `CHINESE_API_BASE_URL` | Chinese API endpoint | Yes | `https://api.inkele.net/mobileShell/en` |
| `CHINESE_API_ACCOUNT` | Chinese API username | Yes | From partner |
| `CHINESE_API_PASSWORD` | Chinese API password | Yes | From partner |
| `CHINESE_API_FIXED_KEY` | Signature generation key | Yes | From partner |
| `CHINESE_API_DEVICE_ID` | Default vending machine ID | Yes | e.g., `JMSOOMSZRQO9` |
| `API_BASE_URL` | Public API URL | Yes | Production: `https://your-api.com` |
| `FRONTEND_URL` | Public frontend URL | Yes | Production: `https://your-site.com` |
| `R2_ACCOUNT_ID` | Cloudflare R2 account | No | For cloud storage |
| `R2_ACCESS_KEY_ID` | R2 access key | No | For cloud storage |
| `R2_SECRET_ACCESS_KEY` | R2 secret | No | For cloud storage |
| `R2_BUCKET_NAME` | R2 bucket name | No | For cloud storage |

### Frontend (.env.local)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL | Yes | `http://localhost:8000` or `https://api.your-domain.com` |
| `VITE_APP_ENV` | Environment name | No | `local`, `production` |
| `VITE_CHINESE_API_DEVICE_ID` | Default device ID | No | `JMSOOMSZRQO9` |

## Generating Secrets

### JWT Secret Key
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Admin Password Hash
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("your-password")
print(hashed)
```

## Database Setup

### SQLite (Development)

Automatically created when you run:
```python
from database import create_tables
create_tables()
```

File location: `./local_dev.db`

### PostgreSQL (Production)

#### 1. Create Database
```bash
createdb pimpmycase
```

#### 2. Run Initial Schema
```bash
psql -d pimpmycase -f init_database.sql
```

#### 3. Verify Tables
```bash
psql -d pimpmycase -c "\dt"
```

Expected tables:
- brands
- phone_models
- templates
- orders
- order_images
- vending_machine_sessions
- vending_machines
- payment_mappings
- admin_users

### Populate Initial Data

#### Phone Models
```bash
python populate_phones.py
```

This script:
- Fetches brands from Chinese API
- Fetches models for each brand
- Populates `brands` and `phone_models` tables
- Syncs Chinese API IDs

## Verification

### 1. Check Frontend
Visit `http://localhost:5173`
- Should see landing page
- Navigation should work
- No console errors

### 2. Check Backend
Visit `http://localhost:8000/health`
```json
{
  "status": "healthy",
  "database": "connected",
  "chinese_api": "reachable"
}
```

### 3. Check API Documentation
Visit `http://localhost:8000/docs`
- Should see Swagger UI
- Try "GET /health" endpoint
- Should return 200 OK

### 4. Check Database
```bash
# SQLite
sqlite3 local_dev.db "SELECT COUNT(*) FROM phone_models;"

# PostgreSQL
psql -d pimpmycase -c "SELECT COUNT(*) FROM phone_models;"
```

Should return > 0 (number of phone models)

## Common Setup Issues

### Issue: Port Already in Use

**Frontend** (port 5173):
```bash
# Kill process on port
kill -9 $(lsof -t -i:5173)
# Or change port in vite.config.js
```

**Backend** (port 8000):
```bash
# Kill process
kill -9 $(lsof -t -i:8000)
# Or specify different port
python api_server.py --port 8001
```

### Issue: Module Not Found

**Frontend**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Backend**:
```bash
pip install --upgrade pip
pip install -r requirements-api.txt
```

### Issue: Database Connection Failed

**Check DATABASE_URL**:
- Ensure format is correct
- Check credentials
- Verify database exists

**PostgreSQL**:
```bash
# Test connection
psql -d pimpmycase -c "SELECT 1;"
```

### Issue: Chinese API Connection Failed

**Check credentials**:
- Verify `CHINESE_API_ACCOUNT`
- Verify `CHINESE_API_PASSWORD`
- Verify `CHINESE_API_FIXED_KEY`

**Test manually**:
```bash
curl -X POST https://api.inkele.net/mobileShell/en/third/brand/list \
  -H "Content-Type: application/json" \
  -d '{"account":"YOUR_ACCOUNT","password":"YOUR_PASSWORD"}'
```

### Issue: Stripe Checkout Fails

**Check keys**:
- Use `sk_test_...` for testing
- Use `sk_live_...` for production
- Match frontend `STRIPE_PUBLISHABLE_KEY` with backend `STRIPE_SECRET_KEY` environment

**Enable Stripe CLI**:
```bash
stripe listen --forward-to localhost:8000/webhook
```

## Development Workflow

### 1. Start Development Environment
```bash
# Terminal 1: Backend
python api_server.py

# Terminal 2: Frontend
npm run dev

# Terminal 3: Admin Dashboard (optional)
cd admin-dashboard && npm run dev
```

### 2. Make Changes
- Frontend: Hot reload automatic
- Backend: Restart server (or use `--reload` flag)

### 3. Test Changes
- Manual testing in browser
- Check API responses in Network tab
- Verify database changes

### 4. Build for Production
```bash
# Frontend
npm run build

# Backend
# No build step - deploy Python files directly
```

## Next Steps

- Read `04-CONFIGURATION.md` for detailed configuration options
- Read `05-API-REFERENCE.md` for API endpoint documentation
- Read `08-DEPLOYMENT.md` for production deployment

---

**Troubleshooting**: See `10-TROUBLESHOOTING.md` if you encounter issues.
