# PimpMyCase Deployment Guide

Simple guide: What to upload where + what to configure.

---

## Architecture

```
Cloudflare R2 → Stickers (1.1 GB)
Hostinger    → Frontend (HTML/CSS/JS)
Render       → Backend API + Database
```

**Total cost:** ~$50/month

---

## Step 1: Upload Stickers to Cloudflare R2

### Upload
1. Create account: https://cloudflare.com
2. Add payment method
3. Go to **R2 Object Storage** → **Create bucket** → Name: `pimpmycase-stickers`
4. Upload `public/Stickers/` folder (drag & drop or CLI)
5. Enable **Public Access**
6. Copy public URL: `https://pub-xxxxx.r2.dev`

### Configure CORS
Bucket settings → **CORS Policy** → Add:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Test
Open: `https://pub-xxxxx.r2.dev/Stickers/ALIEN/thumbnails/1.webp`
Should show image.

---

## Step 2: Deploy Backend to Render

### Create Database
1. Render dashboard: https://dashboard.render.com
2. **New +** → **PostgreSQL** → Name: `pimpmycase-db`
3. Plan: Starter ($7/month)
4. Copy **Internal Database URL**

### Create Backend Service
1. **New +** → **Web Service**
2. Connect GitHub repo
3. Name: `pimpmycase-api`
4. Build: `bash render-build.sh`
5. Start: `bash start-render.sh`
6. Plan: Starter ($7/month)

### Set Environment Variables
```env
DATABASE_URL=<internal database URL from above>
OPENAI_API_KEY=sk-proj-xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
JWT_SECRET_KEY=<run: openssl rand -hex 32>
FRONTEND_URL=https://your-domain.com
```

### After Deploy
1. Copy backend URL: `https://pimpmycase-api.onrender.com`
2. Run in Shell tab: `python populate_phones.py`

---

## Step 3: Deploy Frontend to Hostinger

### Configure Environment
Create `.env.production`:
```env
VITE_API_BASE_URL=https://pimpmycase-api.onrender.com
VITE_STICKER_BASE_URL=https://pub-xxxxx.r2.dev
```

### Build
```bash
npm run build
```

Creates `dist/` folder (~200 MB, no stickers).

### Upload to Hostinger
1. Get FTP credentials from Hostinger panel
2. Connect via FTP (FileZilla, etc.)
3. Upload all files from `dist/` to `public_html/`
4. Verify `.htaccess` is uploaded

### Enable SSL
Hostinger panel → **SSL** → Enable Let's Encrypt → Force HTTPS

---

## Configuration Summary

### What Goes Where

| What | Where | How |
|------|-------|-----|
| **Stickers (1.1GB)** | Cloudflare R2 | Dashboard upload or CLI |
| **Frontend (200MB)** | Hostinger | FTP upload of `dist/` |
| **Backend (code)** | Render | GitHub auto-deploy |
| **Database** | Render PostgreSQL | Auto-created |

---

### Environment Variables

**Backend (Render):**
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
JWT_SECRET_KEY=...
FRONTEND_URL=https://your-domain.com
```

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://pimpmycase-api.onrender.com
VITE_STICKER_BASE_URL=https://pub-xxxxx.r2.dev
```

---

## Update Instructions

### Update Stickers
Upload new files to Cloudflare R2 bucket → Done

### Update Frontend
```bash
npm run build
Upload dist/ to Hostinger via FTP
```

### Update Backend
```bash
git push
Render auto-deploys
```

---

## Required Accounts

| Account | Cost | URL |
|---------|------|-----|
| GitHub | Free | https://github.com |
| Cloudflare | $0.02/month | https://cloudflare.com |
| Hostinger | $6/month | https://hostinger.com |
| Render | $14/month | https://render.com |
| OpenAI | ~$30/month | https://platform.openai.com |
| Stripe | Per transaction | https://stripe.com |

**Total:** ~$50/month + transaction fees

---

## Quick Checklist

### Before Deployment
- [ ] Cloudflare account + payment method
- [ ] Hostinger hosting plan purchased
- [ ] Render account + payment method
- [ ] OpenAI API key
- [ ] Stripe API keys (test or live)

### Deployment
- [ ] Stickers uploaded to R2
- [ ] R2 public URL copied
- [ ] R2 CORS configured
- [ ] Render database created
- [ ] Render backend deployed with env vars
- [ ] Backend URL copied
- [ ] `.env.production` created with URLs
- [ ] Frontend built (`npm run build`)
- [ ] `dist/` uploaded to Hostinger
- [ ] SSL enabled on Hostinger

### Testing
- [ ] Frontend loads: `https://your-domain.com`
- [ ] Backend works: `https://pimpmycase-api.onrender.com/health`
- [ ] Stickers load from R2 (check Network tab)
- [ ] No CORS errors
- [ ] Can upload image
- [ ] Can place stickers
- [ ] Payment test works

---

**That's it!** Three uploads, three environment configs, done.
