# Deployment Guide - PimpMyCase Webstore

## Production Architecture

```
Frontend (Hostinger)          Backend (Render)
pimpmycase.co.uk             pimpmycase-webstore.onrender.com
     |                                |
     └───────────API Calls────────────┘
                                      |
                              PostgreSQL (Render)
```

## Backend Deployment (Render)

### Initial Setup

1. **Create Render Account**: https://render.com

2. **Create PostgreSQL Database**:
   - Dashboard → New → PostgreSQL
   - Name: `pimpmycase-db`
   - Region: Choose closest to users
   - Plan: Free or Starter
   - Copy `DATABASE_URL` (internal connection string)

3. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - Name: `pimpmycase-api`
   - Environment: Python 3
   - Build Command: `pip install -r requirements-api.txt`
   - Start Command: `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
   - Plan: Free or Starter

4. **Environment Variables** (in Render dashboard):
   ```
   DATABASE_URL=<from-database-internal-url>
   JWT_SECRET_KEY=<generate-random-256-bit-key>
   GOOGLE_API_KEY=<your-google-api-key>
   STRIPE_SECRET_KEY=sk_live_<your-stripe-key>
   CHINESE_API_BASE_URL=https://api.inkele.net/mobileShell/en
   CHINESE_API_ACCOUNT=<your-account>
   CHINESE_API_PASSWORD=<your-password>
   CHINESE_API_FIXED_KEY=<your-fixed-key>
   CHINESE_API_DEVICE_ID=<default-device-id>
   API_BASE_URL=https://pimpmycase-webstore.onrender.com
   FRONTEND_URL=https://pimpmycase.co.uk
   ```

5. **Deploy**: Click "Create Web Service" → Auto-deploy from main branch

### Database Migration

```bash
# Connect to Render PostgreSQL
psql postgresql://user:pass@host/db

# Run schema
\i init_database.sql

# Populate phone models
python populate_phones.py
```

### Custom Domain Setup

1. Render Dashboard → Your service → Settings → Custom Domain
2. Add: `api.pimpmycase.co.uk` (or your domain)
3. Update DNS:
   - Type: CNAME
   - Name: api
   - Value: `pimpmycase-api.onrender.com`
4. Wait for SSL certificate (auto-generated)

## Frontend Deployment (Hostinger)

### Build Process

1. **Update Environment**:
```bash
# .env.local (for build)
VITE_API_BASE_URL=https://pimpmycase-webstore.onrender.com
VITE_APP_ENV=production
```

2. **Build**:
```bash
npm run build
```

Output: `dist/` directory

### Hostinger Setup

#### Method 1: FTP Upload

1. **Connect via FTP**:
   - Host: ftp.pimpmycase.co.uk
   - Username: <your-username>
   - Password: <your-password>
   - Port: 21

2. **Upload**:
   - Navigate to `public_html/`
   - Upload all files from `dist/`
   - Maintain directory structure

#### Method 2: Git Deployment (Recommended)

1. **Hostinger Dashboard** → Advanced → Git
2. **Configure Git**:
   - Repository URL: `https://github.com/your-repo.git`
   - Branch: `main`
   - Target directory: `public_html`

3. **Build Script** (in repository):
```bash
# build-frontend-hostinger.sh
#!/bin/bash
npm ci
npm run build
rsync -av dist/ public_html/
```

4. **Auto-deploy**: Push to main → Hostinger auto-pulls and builds

### Domain Configuration

1. **DNS Settings**:
   - Type: A Record
   - Name: @ (or www)
   - Value: <hostinger-server-ip>
   - TTL: 14400

2. **SSL Certificate** (Hostinger auto-provides)

## Admin Dashboard Deployment (Optional)

Deploy separately to `admin.pimpmycase.co.uk`:

```bash
cd admin-dashboard
npm run build
# Upload dist/ to admin subdomain
```

## CI/CD Pipeline (GitHub Actions)

### .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - name: Deploy to Hostinger
        run: |
          # FTP upload or Git push
```

## Environment-Specific Configurations

### Production Settings

**Backend** (.env):
- Use PostgreSQL `DATABASE_URL`
- Use `sk_live_` Stripe keys
- Set `API_BASE_URL` to production domain
- Enable logging level `INFO`

**Frontend** (.env.local):
- Point `VITE_API_BASE_URL` to production API
- Set `VITE_APP_ENV=production`

### Staging (Optional)

Create separate Render services:
- `pimpmycase-staging-api`
- `staging.pimpmycase.co.uk`

## Monitoring

### Render Monitoring

- Dashboard → Your Service → Metrics
- CPU, Memory, Request count
- Logs: Real-time via dashboard

### Error Tracking (Future)

Integrate Sentry:
```python
import sentry_sdk
sentry_sdk.init(dsn="...")
```

## Backup & Recovery

### Database Backups

**Render Auto-Backups**:
- Free plan: No backups
- Paid plans: Daily backups

**Manual Backup**:
```bash
pg_dump postgresql://user:pass@host/db > backup.sql
```

**Restore**:
```bash
psql postgresql://user:pass@host/db < backup.sql
```

### Code Backups

- Git repository (GitHub)
- Local development environment

## Rollback Procedure

### Backend Rollback

1. Render Dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy"
4. Or: Revert git commit and push

### Frontend Rollback

1. Checkout previous commit: `git checkout <commit-hash>`
2. Rebuild: `npm run build`
3. Re-upload `dist/` to Hostinger

## SSL/TLS Certificates

**Render**: Auto-provides Let's Encrypt SSL
**Hostinger**: Auto-provides SSL via cPanel

**Force HTTPS**:
```python
# api_server.py
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
app.add_middleware(HTTPSRedirectMiddleware)
```

## Performance Optimization

### Backend
- Enable gzip compression
- Use connection pooling
- Cache phone model data in memory
- Optimize database queries (indexes)

### Frontend
- Minify JavaScript (Vite does this)
- Compress images (WebP format)
- Enable CDN (Hostinger provides)
- Lazy-load routes

## Health Checks

**Render Health Check**: `/health`

**Monitor**:
```bash
curl https://pimpmycase-webstore.onrender.com/health
```

Expected:
```json
{"status":"healthy","database":"connected"}
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (if tests exist)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Build succeeds locally
- [ ] No sensitive data in code

### Deployment
- [ ] Backend deployed to Render
- [ ] Database migrated
- [ ] Frontend built and uploaded
- [ ] DNS configured
- [ ] SSL certificates active

### Post-Deployment
- [ ] Health check passes
- [ ] Test key user flows
- [ ] Monitor logs for errors
- [ ] Verify payments work (test mode first)
- [ ] Check Chinese API integration

## Common Issues

**Issue**: Render build fails
- **Fix**: Check `requirements-api.txt` for missing dependencies

**Issue**: Database connection fails
- **Fix**: Verify `DATABASE_URL` in environment variables

**Issue**: CORS errors
- **Fix**: Add frontend URL to `backend/config/cors.py`

**Issue**: Frontend can't reach API
- **Fix**: Check `VITE_API_BASE_URL` in build environment

---

**Next**: See `09-MAINTENANCE.md` for ongoing maintenance tasks.
