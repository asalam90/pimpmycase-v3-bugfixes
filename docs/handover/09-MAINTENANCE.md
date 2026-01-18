# Maintenance Guide - PimpMyCase Webstore

## Routine Maintenance Tasks

### Daily Tasks

**Monitor Order Queue**:
```bash
# Check pending orders
curl https://pimpmycase-webstore.onrender.com/api/admin/orders?status=pending
```

**Check API Health**:
```bash
curl https://pimpmycase-webstore.onrender.com/health
```

Expected response: `{"status":"healthy"}`

**Review Logs**:
- Render Dashboard → Logs
- Look for errors, warnings
- Check for suspicious patterns

### Weekly Tasks

**Database Cleanup**:
```sql
-- Remove expired vending sessions (older than 7 days)
DELETE FROM vending_machine_sessions
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Archive old completed orders (optional)
-- Move to archive table after 90 days
```

**Monitor Storage**:
- Check `generated-images/` directory size
- Delete old generated images (>30 days)
```bash
find generated-images/ -name "*.png" -mtime +30 -delete
```

**Update Phone Models**:
```bash
python populate_phones.py  # Sync from Chinese API
```

### Monthly Tasks

**Security Updates**:
```bash
# Frontend
npm audit
npm audit fix

# Backend
pip list --outdated
pip install --upgrade <package>
```

**Backup Database**:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**Review Pricing**:
- Check `src/config/templatePricing.js`
- Update if needed, rebuild frontend

**Analytics Review**:
- Order volume trends
- Popular templates
- Error rates

## Database Maintenance

### Cleanup Expired Sessions

**Automatic** (runs in background):
```python
# In api_server.py startup event
@app.on_event("startup")
async def cleanup_expired_sessions():
    # Runs every 5 minutes
    while True:
        db = SessionLocal()
        db.query(VendingMachineSession).filter(
            VendingMachineSession.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
        await asyncio.sleep(300)
```

**Manual**:
```sql
DELETE FROM vending_machine_sessions
WHERE expires_at < NOW();
```

### Database Optimization

**Vacuum** (PostgreSQL):
```sql
VACUUM ANALYZE orders;
VACUUM ANALYZE phone_models;
```

**Reindex**:
```sql
REINDEX TABLE orders;
```

### Monitor Database Size

```sql
SELECT
  pg_size_pretty(pg_database_size('pimpmycase')) AS database_size;

SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

## Third-Party API Monitoring

### Chinese Manufacturing API

**Check Connectivity**:
```bash
curl -X POST https://api.inkele.net/mobileShell/en/third/brand/list \
  -H "Content-Type: application/json" \
  -d '{"account":"YOUR_ACCOUNT","password":"YOUR_PASSWORD"}'
```

Expected: `{"code":200,...}`

**Monitor Response Times**:
- Should be < 2 seconds
- If slower, contact partner

**Verify Stock Sync**:
```bash
python populate_phones.py
# Check for new models
```

### Stripe Integration

**Dashboard Monitoring**:
- https://dashboard.stripe.com
- Check payment success rate
- Monitor disputes/chargebacks

**Webhook Status**:
- Dashboard → Developers → Webhooks
- Ensure webhook is receiving events
- Check for failures

### Google Gemini AI

**Quota Monitoring**:
- Google Cloud Console → API & Services → Quotas
- Monitor daily request count
- Upgrade plan if approaching limit

**Error Rate**:
- Check logs for AI generation failures
- If >5%, investigate

## Log Management

### Log Locations

**Render (Production)**:
- Dashboard → Your Service → Logs
- Real-time streaming
- Search/filter capability

**Local Development**:
- `pimpmycase_api.log` (backend)
- Browser Console (frontend)

### Log Rotation

**Render**: Auto-rotates, keeps 7 days

**Local**:
```python
# api_server.py
import logging
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'pimpmycase_api.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
```

### Important Log Patterns

**Look for**:
- `ERROR` - Application errors
- `HTTP 5xx` - Server errors
- `Chinese API failed` - Integration issues
- `Payment failed` - Stripe issues
- `Rate limit exceeded` - Abuse attempts

## Security Maintenance

### Update Dependencies

**Check for Vulnerabilities**:
```bash
# Frontend
npm audit

# Backend
pip-audit  # Install: pip install pip-audit
```

**Update**:
```bash
# Frontend
npm update
npm audit fix

# Backend
pip install --upgrade <package>
```

### Rotate Secrets

**Quarterly**:
- Generate new `JWT_SECRET_KEY`
- Update in Render environment variables
- Restart service

**If Compromised**:
- Immediately rotate all API keys
- Review access logs
- Reset admin passwords

### Monitor Access

**Check for**:
- Unusual traffic patterns
- Failed login attempts (admin)
- Rate limit triggers
- Suspicious IPs

## Performance Monitoring

### Key Metrics

**Response Times**:
- `/health`: < 100ms
- `/create-checkout-session`: < 1s
- `/api/images/generate`: < 10s

**Database Queries**:
- Most queries: < 100ms
- Complex joins: < 500ms

**Memory Usage** (Render):
- Should be < 512MB (Free tier limit)
- If approaching limit, investigate leaks

### Optimization Tips

**Slow Endpoints**:
1. Check database queries (add indexes)
2. Enable caching (Redis)
3. Optimize image processing
4. Review N+1 query patterns

**High Memory**:
1. Clear image cache periodically
2. Limit in-memory storage
3. Use file-based storage for large data

## Dependency Updates

### Frontend

**Update Process**:
```bash
# Check outdated packages
npm outdated

# Update package.json
npm update

# Test locally
npm run dev
npm run build

# Deploy
git commit -am "Update frontend dependencies"
git push
```

### Backend

**Update Process**:
```bash
# Check outdated
pip list --outdated

# Update specific package
pip install --upgrade fastapi

# Update requirements
pip freeze > requirements-api.txt

# Test locally
python api_server.py

# Deploy
git commit -am "Update backend dependencies"
git push
```

## Backup Strategy

### What to Backup

1. **Database** (Daily):
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Code** (Automatic via Git):
   - Pushed to GitHub
   - No additional backup needed

3. **Generated Images** (Weekly):
   - Archive `generated-images/` folder
   - Upload to cloud storage

4. **Configuration**:
   - Export environment variables (redacted)
   - Document manual settings

### Backup Retention

- **Daily backups**: Keep 7 days
- **Weekly backups**: Keep 4 weeks
- **Monthly backups**: Keep 12 months

### Backup Storage

- **Render**: Automatic database backups (paid plans)
- **Manual**: Google Drive, AWS S3, or Cloudflare R2

## Disaster Recovery

### Database Corruption

1. Stop application
2. Restore from latest backup:
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD.sql
   ```
3. Verify data integrity
4. Restart application

### API Service Down

1. Check Render status
2. Review recent deployments
3. Rollback if needed (see Deployment Guide)
4. Contact Render support if platform issue

### Complete System Failure

1. Restore database from backup
2. Redeploy backend to Render
3. Rebuild and redeploy frontend
4. Verify all integrations working
5. Test key user flows

## Scaling Considerations

### When to Scale

**Backend**:
- CPU usage > 80% sustained
- Response times > 2s average
- Memory usage approaching limit

**Database**:
- Query times > 1s
- Connection pool exhausted
- Storage > 80% full

### How to Scale

**Render**:
- Upgrade plan (Free → Starter → Standard)
- Enable auto-scaling
- Add Redis cache

**Database**:
- Upgrade PostgreSQL plan
- Add read replicas
- Implement connection pooling

## Contact Information

**Platform Support**:
- Render: support@render.com
- Hostinger: Live chat (cPanel)
- Stripe: https://support.stripe.com

**API Partners**:
- Chinese Manufacturing: <partner-contact>
- Google Cloud: Console support

---

**Next**: See `10-TROUBLESHOOTING.md` for common issues and solutions.
