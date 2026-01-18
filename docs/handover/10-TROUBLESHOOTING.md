# Troubleshooting Guide - PimpMyCase Webstore

## Quick Diagnostics

### System Health Check

```bash
# 1. Check API
curl https://pimpmycase-webstore.onrender.com/health

# 2. Check Frontend
curl https://pimpmycase.co.uk

# 3. Check Database
psql $DATABASE_URL -c "SELECT 1;"

# 4. Check Chinese API
curl -X POST https://api.inkele.net/mobileShell/en/third/brand/list \
  -H "Content-Type: application/json" \
  -d '{"account":"ACCOUNT","password":"PASSWORD"}'
```

## Common Issues & Solutions

### Frontend Issues

#### Issue: "Cannot connect to API" / CORS Error

**Symptoms**:
- Network errors in browser console
- "CORS policy blocked" messages

**Diagnosis**:
```javascript
// Check browser console
console.log(import.meta.env.VITE_API_BASE_URL)
```

**Solutions**:

1. **Check API URL**:
   - `.env.local`: `VITE_API_BASE_URL=https://pimpmycase-webstore.onrender.com`
   - Rebuild: `npm run build`

2. **Add Origin to CORS**:
   ```python
   # backend/config/cors.py
   ALLOWED_ORIGINS = [
       "https://pimpmycase.co.uk",
       "https://www.pimpmycase.co.uk"  # Add www version
   ]
   ```

3. **Check API is Running**:
   ```bash
   curl https://pimpmycase-webstore.onrender.com/health
   ```

#### Issue: Stickers Not Loading

**Symptoms**:
- Empty sticker grid
- "Failed to load stickers" error

**Diagnosis**:
```javascript
// Check browser console for 404 errors
// Check public/Stickers/ directory exists
```

**Solutions**:

1. **Verify Sticker Files**:
   ```bash
   ls -la public/Stickers/CATS/
   ```

2. **Check File Permissions** (Hostinger):
   - Files: 644
   - Directories: 755

3. **Clear Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

#### Issue: Uploaded Images Not Displaying

**Symptoms**:
- Blank image preview
- "Invalid image" error

**Diagnosis**:
- Check browser console for errors
- Verify image size < 10MB

**Solutions**:

1. **Check File Type**:
   - Supported: JPEG, PNG, WebP
   - Not supported: GIF, BMP, SVG

2. **Reduce Image Size**:
   ```javascript
   // Max size check in frontend
   if (file.size > 10 * 1024 * 1024) {
     alert("Image too large (max 10MB)")
   }
   ```

### Backend Issues

#### Issue: API Not Responding / 503 Error

**Symptoms**:
- `/health` endpoint timeout
- Render service shows "Deploying" or "Failed"

**Diagnosis**:
```bash
# Check Render service status
# Dashboard → Your Service → Events
```

**Solutions**:

1. **Check Render Logs**:
   - Dashboard → Logs
   - Look for errors during startup

2. **Verify Environment Variables**:
   - Dashboard → Environment
   - Ensure all required vars set

3. **Restart Service**:
   - Dashboard → Manual Deploy → "Clear build cache & deploy"

4. **Check Build Command**:
   ```bash
   pip install -r requirements-api.txt
   ```

5. **Check Start Command**:
   ```bash
   uvicorn api_server:app --host 0.0.0.0 --port $PORT
   ```

#### Issue: Database Connection Failed

**Symptoms**:
- "could not connect to server" error
- Database queries timeout

**Diagnosis**:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

**Solutions**:

1. **Check DATABASE_URL**:
   - Render Dashboard → Database → Connection Details
   - Copy Internal Connection String
   - Update in Web Service environment variables

2. **Verify Format**:
   ```
   postgresql://username:password@hostname:5432/database
   ```

3. **Check Database Status**:
   - Render Dashboard → Database → Status
   - Should show "Available"

4. **Increase Connection Pool**:
   ```python
   # database.py
   engine = create_engine(
       DATABASE_URL,
       pool_size=10,
       max_overflow=20
   )
   ```

#### Issue: "Module Not Found" Error

**Symptoms**:
- Import errors on Render
- Works locally but not in production

**Diagnosis**:
- Check Render build logs

**Solutions**:

1. **Update requirements.txt**:
   ```bash
   pip freeze > requirements-api.txt
   git commit -am "Update requirements"
   git push
   ```

2. **Check Python Version**:
   - Render: Uses Python 3.11 by default
   - Specify in `runtime.txt`:
     ```
     python-3.10.12
     ```

### Payment Issues

#### Issue: Stripe Checkout Fails

**Symptoms**:
- "Payment session creation failed"
- Stripe errors in logs

**Diagnosis**:
```python
# Check logs for Stripe error messages
```

**Solutions**:

1. **Verify Stripe Keys**:
   - Test: `sk_test_...`
   - Live: `sk_live_...`
   - Match environment (test with test, live with live)

2. **Check API Version**:
   - Stripe Dashboard → Developers → API version
   - Update if needed:
     ```python
     stripe.api_version = '2024-12-18'
     ```

3. **Enable Webhook** (if using):
   - Stripe Dashboard → Webhooks
   - Endpoint: `https://pimpmycase-webstore.onrender.com/webhook/stripe`
   - Events: `checkout.session.completed`

4. **Test Mode**:
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

#### Issue: Chinese API Integration Failed

**Symptoms**:
- "Chinese API error" in logs
- Orders not submitted to manufacturer

**Diagnosis**:
```bash
# Test API credentials
curl -X POST https://api.inkele.net/mobileShell/en/third/brand/list \
  -H "Content-Type: application/json" \
  -d '{"account":"ACCOUNT","password":"PASSWORD","sign":"CALCULATED_SIGN"}'
```

**Solutions**:

1. **Verify Credentials**:
   - `CHINESE_API_ACCOUNT`
   - `CHINESE_API_PASSWORD`
   - `CHINESE_API_FIXED_KEY`

2. **Check Signature Generation**:
   ```python
   # backend/services/chinese_api_service.py
   # Verify generate_signature() function
   ```

3. **Test Single Endpoint**:
   ```bash
   python -c "from backend.services.chinese_api_service import *; print(get_brands())"
   ```

4. **Contact Partner**:
   - If credentials correct but still failing
   - May need IP whitelisting

### AI Generation Issues

#### Issue: "AI generation failed"

**Symptoms**:
- Image generation returns error
- Timeout after 30 seconds

**Diagnosis**:
- Check Google Cloud Console → API usage

**Solutions**:

1. **Verify API Key**:
   - Google AI Studio → API keys
   - Ensure key is active

2. **Check Quota**:
   - Google Cloud Console → Quotas
   - Increase if limit reached

3. **Reduce Image Size**:
   - Compress image before sending to AI
   - Target: < 4MB

4. **Retry Logic**:
   ```python
   # Add retry in ai_service.py
   for attempt in range(3):
       try:
           return generate_image(...)
       except Exception as e:
           if attempt == 2:
               raise
           time.sleep(2)
   ```

### Vending Machine Issues

#### Issue: QR Session Expired

**Symptoms**:
- "Session expired" error
- User scans QR but can't proceed

**Diagnosis**:
```sql
SELECT * FROM vending_machine_sessions
WHERE session_id = 'vs_xxx';
```

**Solutions**:

1. **Increase Timeout**:
   ```python
   # backend/config/settings.py
   SESSION_TIMEOUT_MINUTES = 45  # Increase from 30
   ```

2. **Create New Session**:
   - Vending machine generates new QR
   - User scans new code

3. **Disable Auto-Cleanup** (temporary):
   ```python
   # Comment out in api_server.py
   # @app.on_event("startup")
   # async def cleanup_expired_sessions(): ...
   ```

#### Issue: Payment Not Confirming

**Symptoms**:
- Payment made on vending machine
- Order not created
- Chinese API shows no payment

**Diagnosis**:
- Check `vending_machine_sessions` table
- Check `payment_mappings` table

**Solutions**:

1. **Manual Confirmation**:
   ```python
   # Connect to database
   python
   >>> from database import SessionLocal
   >>> from models import VendingMachineSession
   >>> db = SessionLocal()
   >>> session = db.query(VendingMachineSession).filter_by(
   ...     session_id='vs_xxx'
   ... ).first()
   >>> # Check session.order_summary
   ```

2. **Resend to Chinese API**:
   ```python
   from backend.services.chinese_payment_service import send_payment_to_chinese_api
   result = send_payment_to_chinese_api(...)
   ```

### Performance Issues

#### Issue: Slow Response Times

**Symptoms**:
- Pages take >5 seconds to load
- API endpoints timeout

**Diagnosis**:
```bash
# Check response time
curl -w "@curl-format.txt" -o /dev/null -s https://pimpmycase-webstore.onrender.com/health

# curl-format.txt:
# time_total: %{time_total}s
```

**Solutions**:

1. **Check Render Metrics**:
   - Dashboard → Metrics
   - Look for CPU/memory spikes

2. **Optimize Database Queries**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'paid';
   ```

3. **Add Indexes**:
   ```sql
   CREATE INDEX idx_orders_status ON orders(status);
   CREATE INDEX idx_sessions_session_id ON vending_machine_sessions(session_id);
   ```

4. **Upgrade Render Plan**:
   - Free tier has limited resources
   - Starter plan: Better performance

#### Issue: Out of Memory

**Symptoms**:
- Render service crashes
- "Memory limit exceeded" in logs

**Diagnosis**:
- Render Dashboard → Metrics → Memory usage

**Solutions**:

1. **Clear Image Cache**:
   ```bash
   rm -rf generated-images/*
   ```

2. **Limit Concurrent Requests**:
   ```python
   # api_server.py
   app = FastAPI(max_concurrency=50)
   ```

3. **Upgrade Plan**:
   - Free: 512MB
   - Starter: 2GB

### Data Issues

#### Issue: Phone Model Missing

**Symptoms**:
- User's phone model not in list
- "Model not found" error

**Diagnosis**:
```sql
SELECT * FROM phone_models WHERE display_name LIKE '%iPhone 16%';
```

**Solutions**:

1. **Sync from Chinese API**:
   ```bash
   python populate_phones.py
   ```

2. **Manual Add**:
   ```sql
   INSERT INTO phone_models (
     id, brand_id, display_name, width, height,
     chinese_model_id, mobile_shell_id
   ) VALUES (
     'iphone-16-pro-max', 'apple', 'iPhone 16 Pro Max',
     76.7, 159.5,
     'CHINESE_ID', 'MS_ID'
   );
   ```

## Debug Endpoints

### Health Check
```bash
GET /health
```

### Database Stats
```bash
GET /api/database/stats
```

### Test Image Generation (Local Only)
```python
# Test AI service
python -c "from backend.services.ai_service import *; print(test_generation())"
```

## Log Analysis

### Important Log Patterns

**Look for**:
```
ERROR - Database connection failed
ERROR - Chinese API request failed: 401 Unauthorized
ERROR - Stripe checkout creation failed
WARNING - Rate limit exceeded for IP xxx.xxx.xxx.xxx
```

### Filter Logs

**Render**:
- Search box: "ERROR"
- Time range: Last 1 hour

**Local**:
```bash
grep "ERROR" pimpmycase_api.log
tail -f pimpmycase_api.log | grep "Chinese API"
```

## Getting Help

### Check Documentation First
1. This guide (`10-TROUBLESHOOTING.md`)
2. Architecture (`02-ARCHITECTURE.md`)
3. API Reference (`05-API-REFERENCE.md`)

### Platform Support
- **Render**: support@render.com
- **Hostinger**: Live chat in cPanel
- **Stripe**: https://support.stripe.com

### Community Resources
- FastAPI docs: https://fastapi.tiangolo.com
- React docs: https://react.dev
- SQLAlchemy docs: https://docs.sqlalchemy.org

---

**End of Handover Documentation**

If issues persist after trying solutions in this guide, contact the development team or relevant platform support.
