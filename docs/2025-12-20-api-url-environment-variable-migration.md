# API URL Environment Variable Migration

**Date:** 2025-12-20
**Status:** Completed
**Impact:** All hardcoded API URLs replaced with environment variables

## Summary

Migrated from hardcoded API URLs (`https://pimpmycase.onrender.com`) to environment variable-based configuration pointing to the new API server (`https://pimpmycase-webstore.onrender.com`).

## Changes Made

### 1. Backend Configuration (4 files)

**backend/config/settings.py**
- Added `API_BASE_URL = os.getenv('API_BASE_URL', 'https://pimpmycase-webstore.onrender.com')`
- Replaced `UK_HOSTED_BASE_URL` with new environment-based variable

**backend/services/file_service.py**
- Updated import to use `API_BASE_URL`
- `generate_secure_image_url()` now uses `API_BASE_URL` as fallback

**backend/routes/image.py**
- Added `API_BASE_URL` import
- Token refresh endpoint now uses `API_BASE_URL`

**backend/routes/vending.py**
- Added `API_BASE_URL` import
- Updated Chinese API integration to use `API_BASE_URL`
- Changed domain check from `'pimpmycase.onrender.com'` to `'/image/'` pattern

### 2. Additional Backend Files (2 files)

**backend/routes/chinese_api.py**
- Added `API_BASE_URL` import
- Updated 7 locations using hardcoded URLs
- Changed domain checks to path-based checks

**backend/services/chinese_payment_service.py**
- Updated domain check to path-based check

### 3. Frontend Configuration (2 files)

**src/config/environment.js**
- Updated production fallback URLs from old to new domain
- Both `apiBaseUrl` and `fileBaseUrl` now point to `https://pimpmycase-webstore.onrender.com`

**admin-dashboard/.env.production**
- Changed from HTTP to HTTPS: `https://pimpmycase-webstore.onrender.com`

### 4. Environment Files (2 files)

**.env**
- Added `API_BASE_URL=http://localhost:8000` for local development
- Updated comments to reference new production domain

**env.example**
- Added documentation for `API_BASE_URL` variable
- Updated production URL examples to new domain

## Environment Variables

### Frontend (Vite)
```bash
# Development
VITE_API_BASE_URL=http://localhost:8000

# Production
VITE_API_BASE_URL=https://pimpmycase-webstore.onrender.com
```

### Backend (Python)
```bash
# Development
API_BASE_URL=http://localhost:8000

# Production
API_BASE_URL=https://pimpmycase-webstore.onrender.com
```

## Deployment Steps

1. Update `.env` file on production server with new `API_BASE_URL`
2. Update Render environment variables:
   - `VITE_API_BASE_URL=https://pimpmycase-webstore.onrender.com`
   - `API_BASE_URL=https://pimpmycase-webstore.onrender.com`
3. Redeploy both frontend and backend services

## Files Modified

**Total: 10 files**

Backend (6):
- `backend/config/settings.py`
- `backend/services/file_service.py`
- `backend/routes/image.py`
- `backend/routes/vending.py`
- `backend/routes/chinese_api.py`
- `backend/services/chinese_payment_service.py`

Frontend (2):
- `src/config/environment.js`
- `admin-dashboard/.env.production`

Environment (2):
- `.env`
- `env.example`

## Benefits

1. **Flexibility**: API URL can be changed via environment variables without code changes
2. **Consistency**: Single source of truth for API URLs
3. **Security**: Easier to manage different URLs across environments
4. **Maintainability**: No hardcoded URLs scattered across codebase

## Verification

Remaining hardcoded references are only in:
- `debug_payment_mapping.py` (debug script - low priority)
- `debug_registration.py` (debug script - low priority)
- `backend/archived/routes/vending.py` (archived code)
- Documentation files (`.md` files)

All production code now uses environment variables.
