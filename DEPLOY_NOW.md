# 🚀 Deploy to Render - Quick Start Guide

## ⚠️ BEFORE YOU DEPLOY - CRITICAL ACTIONS

### 1. Secure Your JWT Secret (2 minutes)

**Current JWT Secret is INSECURE!**

A secure JWT secret has been generated for you:
```
dAHl1lEoYaWHOjozvI7JaCvIACKe3qQUgmYeuiBXr6N9vJ4apoRfTqCn3eHVpv1VyiTnSa7nhrAO086luflGRA
```

**Add to Render Dashboard:**
1. Go to your service → Environment
2. Add: `JWT_SECRET_KEY` = (paste secret above)
3. Save Changes

### 2. Get Stripe LIVE Keys (5 minutes)

**Current Stripe keys are TEST keys!**

**Action:**
1. Go to: https://dashboard.stripe.com/apikeys
2. Switch to "Production" mode (top right)
3. Reveal and copy your LIVE keys

**Add to Render Dashboard:**
```
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
```

### 3. Configure R2 in Render (3 minutes)

**Add these to Render Dashboard:**
```
R2_ACCESS_KEY_ID=a255dd972f3179e76b2fd15dfb6f970e
R2_SECRET_ACCESS_KEY=84fa8e78c465c258ab4d6d98b33b5a34b0d1804cdcff18e65c2a19b7b3a18eb5
R2_ENDPOINT_URL=https://41fa326374899d7fe9907d2240bec238.r2.cloudflarestorage.com
R2_BUCKET_NAME=pimpmycase-stickers
```

**IMPORTANT:** Remove these from `.env` file after adding to Render!

### 4. Set Production URLs (1 minute)

**Add to Render Dashboard:**
```
VITE_API_BASE_URL=https://pimpmycase-fullstack.onrender.com
FRONTEND_URL=https://pimpmycase-fullstack.onrender.com
```

*(Replace with your actual Render URL)*

---

## 📦 Deployment Steps

### Step 1: Create Render Account
1. Go to: https://render.com
2. Sign up / Sign in with GitHub

### Step 2: Connect Repository
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the `pimpmycase-webstore` repository

### Step 3: Configure Service
Use these settings:

```
Name: pimpmycase-fullstack
Region: Oregon (or nearest to you)
Branch: main (or your production branch)
Runtime: Python 3
Build Command: bash render-build.sh
Start Command: bash start-render.sh
Instance Type: Free (or Starter for better performance)
```

### Step 4: Add Environment Variables
Click "Advanced" → Add all environment variables:

**Required Variables:**
```
DATABASE_URL=<from Render PostgreSQL>
OPENAI_API_KEY=<your OpenAI key>
JWT_SECRET_KEY=<use generated secret above>
STRIPE_SECRET_KEY=<your LIVE key>
STRIPE_PUBLISHABLE_KEY=<your LIVE key>
R2_ACCESS_KEY_ID=<from above>
R2_SECRET_ACCESS_KEY=<from above>
R2_ENDPOINT_URL=<from above>
R2_BUCKET_NAME=pimpmycase-stickers
VITE_API_BASE_URL=<your Render URL>
FRONTEND_URL=<your Render URL>
ENVIRONMENT=production
DEBUG=false
```

**Optional Variables:**
```
NODE_VERSION=18.0.0
PYTHON_VERSION=3.11.0
STRIPE_WEBHOOK_SECRET=<configure after first deploy>
```

### Step 5: Create PostgreSQL Database (if needed)
1. In Render Dashboard → "New +" → "PostgreSQL"
2. Name: `pimpmycase-db`
3. Region: Same as your web service
4. Plan: Free
5. Copy the "Internal Database URL"
6. Add to web service as `DATABASE_URL`

### Step 6: Deploy!
1. Click "Create Web Service"
2. Wait for build to complete (~5-10 minutes)
3. Monitor logs for any errors

---

## ✅ Post-Deployment Checks

### Immediate Checks (do these right away):

1. **Health Check**
   ```bash
   curl https://your-service.onrender.com/api
   ```
   Expected: `{"message":"PimpMyCase API...","status":"active"}`

2. **R2 Stickers**
   ```bash
   curl https://your-service.onrender.com/api/stickers/categories
   ```
   Expected: List of sticker categories

3. **Frontend Loading**
   - Open: https://your-service.onrender.com
   - Should see the PimpMyCase homepage

### Test Critical Flows:

- [ ] Browse phone models
- [ ] Upload an image
- [ ] View stickers (should load from R2)
- [ ] Add stickers to design
- [ ] Test payment (use Stripe test card: 4242 4242 4242 4242)

---

## 🚨 If Something Goes Wrong

### Build Fails
1. Check Render logs: Service → Logs tab
2. Look for Python/Node errors
3. Common issues:
   - Missing dependencies in requirements-api.txt
   - Node version mismatch
   - Missing environment variables

### R2 Stickers Not Loading
1. Verify R2 credentials in environment variables
2. Check bucket name is correct
3. Test R2 connection:
   ```bash
   curl https://your-service.onrender.com/api/stickers/image/ALIEN/thumbnails/1.webp
   ```

### Database Connection Errors
1. Verify DATABASE_URL is set
2. Check PostgreSQL service is running
3. Ensure web service and database are in same region

### Payment Not Working
1. Verify Stripe LIVE keys are set (not TEST keys)
2. Check Stripe dashboard for any errors
3. Verify webhook endpoint is configured

---

## 📊 Monitor Your Deployment

### Check Logs
```
Render Dashboard → Your Service → Logs
```

### Key Things to Monitor:
- Server startup messages
- Any error/warning logs
- API request logs
- Database connection status

### Set Up Monitoring (Recommended)
1. **UptimeRobot** - Free uptime monitoring
   - Add: https://your-service.onrender.com/api

2. **Sentry** - Error tracking (optional)
   - Track JavaScript and Python errors

---

## 🔒 Security Checklist

Before going live:
- [ ] JWT secret changed from default
- [ ] Stripe LIVE keys configured
- [ ] R2 credentials not in git repository
- [ ] .env file in .gitignore
- [ ] Database password is strong
- [ ] CORS origins configured correctly

---

## 📝 Quick Reference

### Your Service URLs
- **Frontend**: https://pimpmycase-fullstack.onrender.com
- **API**: https://pimpmycase-fullstack.onrender.com/api
- **Health Check**: https://pimpmycase-fullstack.onrender.com/api

### Important Dashboards
- **Render**: https://dashboard.render.com
- **Stripe**: https://dashboard.stripe.com
- **Cloudflare R2**: https://dash.cloudflare.com

### Support
- Render docs: https://render.com/docs
- Check logs for errors
- Review PRODUCTION_READINESS_CHECKLIST.md for comprehensive details

---

## 🎉 You're Ready!

Once all environment variables are set:
1. Push your code to GitHub
2. Render will auto-deploy
3. Monitor the build
4. Test your application
5. Go live!

**Estimated deployment time**: 15-20 minutes (first deploy)

Good luck with your launch! 🚀
