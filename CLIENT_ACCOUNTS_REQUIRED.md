# Client: Required Accounts & Costs

This document lists all the accounts your client needs to create and pay for to run the PimpMyCase application.

---

## Required Accounts Summary

| # | Service | Cost | Purpose | Required? |
|---|---------|------|---------|-----------|
| 1 | **GitHub** | **Free** | Code storage | ✅ Required |
| 2 | **Hostinger** | **$2-10/month** | Frontend hosting | ✅ Required |
| 3 | **Render** | **$14/month** | Backend API + Database | ✅ Required |
| 4 | **Cloudflare** | **$0.02/month** | Sticker CDN hosting | ✅ Required |
| 5 | **OpenAI** | **~$30/month** | AI image generation | ✅ Required |
| 6 | **Stripe** | **Per transaction** | Payment processing | ✅ Required |

---

## 1. GitHub Account

**Purpose:** Stores application code (not assets)

**Cost:** **FREE**

**Sign up:** https://github.com

**What client needs to do:**
1. Create free GitHub account
2. Give you access to their repository
3. No payment method needed

**Monthly cost:** $0

---

## 2. Hostinger Account

**Purpose:** Hosts the frontend website (HTML, CSS, JavaScript files)

**Cost Options:**
- **Single Web Hosting:** $2-3/month (Basic plan)
- **Premium Web Hosting:** $3-6/month (More storage + performance)
- **Business Web Hosting:** $4-10/month (Best performance)

**Recommended:** Premium plan ($3-6/month)

**Sign up:** https://hostinger.com

**What client needs to do:**
1. Create Hostinger account
2. Choose web hosting plan
3. Register domain (if don't have one) or connect existing domain
4. Add payment method
5. You'll upload frontend files via FTP

**What's included:**
- Static file hosting
- Free SSL certificate (HTTPS)
- Domain (usually included in plan)
- Email accounts
- File Manager / FTP access

**Monthly cost:** $2-10/month (depending on plan)

---

## 3. Render Account

**Purpose:** Hosts the backend API and database (not frontend)

**Cost Options:**

### Free Tier (Testing Only)
- $0/month for first 90 days
- Sleeps after 15 minutes of inactivity
- 30-60 second startup time when someone visits
- **Not suitable for production**

### Production Tier (Recommended)
- **$7/month** - Web service (always-on, no sleep)
- **$7/month** - PostgreSQL database
- **Total: $14/month**

**Sign up:** https://render.com

**What client needs to do:**
1. Create Render account
2. Add payment method (credit/debit card)
3. You'll set up services for them

**Monthly cost:** $14/month (production)

---

## 3. Cloudflare Account

**Purpose:** Hosts 1.1 GB of sticker images with global CDN

**Cost:** **$0.015/GB/month**
- 1.1 GB × $0.015 = **$0.017/month ≈ $0.02/month**
- Essentially **2 cents per month**

**Sign up:** https://cloudflare.com

**What client needs to do:**
1. Create Cloudflare account
2. Add payment method (credit/debit card)
3. You'll upload stickers and configure

**Why not free alternatives:**
- Google Drive: Rate limiting, will break with multiple users
- Free hosting: Usually has limits or unreliable

**Monthly cost:** $0.02/month (basically free)

---

## 4. OpenAI Account

**Purpose:** AI-powered phone case designs (Retro Remix, Toonify, etc.)

**Cost:** **Pay-as-you-go** (variable based on usage)

**Pricing:**
- DALL-E 3 (1024x1024): ~$0.04 per image
- GPT-4 Vision API: ~$0.01 per request
- No monthly fee, only pay for what you use

**Usage estimates:**
- **Light usage** (10 AI designs/day): ~$10/month
- **Medium usage** (30 AI designs/day): ~$30/month
- **High usage** (100 AI designs/day): ~$100/month

**Sign up:** https://platform.openai.com

**What client needs to do:**
1. Create OpenAI account
2. Add payment method (credit/debit card)
3. Set up billing limits (recommended: $50/month to start)
4. You'll get API key from their account

**Monthly cost:** $10-50/month (depends on traffic)

**Cost per customer:**
- If customer uses AI feature: ~$0.05
- If customer uses regular template: $0

---

## 5. Stripe Account

**Purpose:** Payment processing for customer orders

**Cost:** **Per-transaction fees only**
- **No monthly fee**
- **2.9% + $0.30** per successful charge

**Example calculations:**
- $20 phone case sale = $0.88 fee = client keeps $19.12
- $25 phone case sale = $1.03 fee = client keeps $23.97
- $30 phone case sale = $1.17 fee = client keeps $28.83

**Sign up:** https://stripe.com

**What client needs to do:**
1. Create Stripe account
2. Complete business verification (for live payments)
3. Add bank account (to receive payouts)
4. You'll integrate with API keys

**Monthly cost:** $0 fixed + per-transaction fees

**Revenue example:**
- 100 orders at $25 each = $2,500 revenue
- Stripe fees: $102.50
- Net revenue: $2,397.50

---

## Total Monthly Costs

### During Development (Free Tier)
```
GitHub:           $0.00
Hostinger:        $3.00  (cheapest plan)
Render:           $0.00  (90 days free)
Cloudflare:       $0.02
OpenAI:          $10.00  (light testing)
Stripe:           $0.00  (no real transactions)
─────────────────────────
TOTAL:           $13.02/month
```

**Duration:** First 90 days

---

### Production (Recommended)
```
GitHub:           $0.00
Hostinger:        $6.00  (premium plan)
Render:          $14.00  (always-on backend + database)
Cloudflare:       $0.02
OpenAI:          $30.00  (estimated medium usage)
Stripe:           $0.00  (fees per transaction)
─────────────────────────
TOTAL:           $50.02/month
```

**Plus:** Stripe transaction fees (2.9% + $0.30 per sale)

---

## Break-Even Analysis

**Fixed costs per month:** $50.02

**Variable costs per phone case sold:**
- With AI design: $0.05 (OpenAI) + Stripe fees
- Without AI: $0 (OpenAI) + Stripe fees

**At $25 per phone case:**
- Stripe fee: $1.03
- OpenAI (if used): $0.05
- Total variable cost: $1.08
- Net profit per case: $23.92

**Break-even calculation:**
- Fixed costs: $50.02
- Net profit per case: $23.92
- **Break-even: 3 phone cases per month**

**Profitability:**
- 10 cases/month: $239.20 profit - $50.02 fixed = **$189.18 net**
- 50 cases/month: $1,196 profit - $50.02 fixed = **$1,145.98 net**
- 100 cases/month: $2,392 profit - $50.02 fixed = **$2,341.98 net**

---

## Account Setup Timeline

**Total setup time:** ~2 hours

1. **GitHub** (5 min)
   - Create account
   - Verify email

2. **Hostinger** (15 min)
   - Create account
   - Choose hosting plan
   - Add domain
   - Add payment method
   - Verify card

3. **Render** (10 min)
   - Create account
   - Add payment method
   - Verify card

4. **Cloudflare** (15 min)
   - Create account
   - Add payment method
   - Create R2 bucket
   - Upload stickers (done by you)

5. **OpenAI** (10 min)
   - Create account
   - Add payment method
   - Set billing limits
   - Generate API key

6. **Stripe** (30-60 min)
   - Create account
   - Complete business verification
   - Add bank account
   - Verify identity (may take 1-2 business days)

---

## Important Notes for Client

### 1. All Accounts Are Industry Standard
- These are the same services used by thousands of businesses
- No obscure or risky platforms
- All have strong security and compliance

### 2. Credit Cards Required
- Render, Cloudflare, OpenAI, Stripe all require a credit/debit card
- Even for free tiers (to prevent abuse)
- Cards are charged monthly automatically

### 3. Stripe Is Separate from Other Costs
- Stripe fees come out of each sale
- Not a separate bill
- They deposit net amount directly to client's bank

### 4. OpenAI Costs Scale with Usage
- No customers = $0/month
- More customers = higher cost, but also more revenue
- Can set spending limits to prevent surprises

### 5. Can Start with Free Tier
- Use free Render tier for testing (90 days)
- Only pay for Cloudflare ($0.02) and OpenAI (light usage ~$10)
- Total ~$10/month while testing
- Upgrade to production when ready to launch

---

## Payment Method Summary

**Client needs:**
- 1× Credit or debit card (for all services except GitHub)
- 1× Bank account (for Stripe payouts only)

**You need:**
- Access to their accounts to get API keys and configure services
- OR they can create accounts and give you API keys

---

## Recommended Approach

### Phase 1: Development (Month 1-3)
**Costs:** ~$13/month
- Hostinger: $3/month (basic plan)
- Render free tier (90 days)
- Stripe test mode (no real charges)
- Light OpenAI usage for testing
- Cloudflare $0.02

**Action:** Test everything, fix bugs, prepare for launch

### Phase 2: Production (Month 4+)
**Costs:** ~$50/month + transaction fees
- Hostinger: $6/month (premium plan)
- Upgrade Render to production ($14/month)
- Switch Stripe to live mode
- OpenAI scales with real usage
- Cloudflare stays $0.02

**Action:** Launch and start making money

### Break-Even: ~3 sales per month
### Good profit: 20+ sales per month

---

## Questions & Answers

**Q: Can we use cheaper alternatives?**
A: Not recommended. Google Drive will break with multiple users. Free hosting is unreliable. These services cost ~$50/month but save hundreds in development and debugging time.

**Q: What if we don't get many customers at first?**
A: Start with free Render tier ($13/month total with Hostinger basic plan). Only upgrade when you're making sales.

**Q: Can costs be reduced?**
A: Hostinger, Render and Cloudflare are fixed. OpenAI only charges when customers use AI features - you could remove AI templates to reduce costs. Stripe is only per-transaction. The total fixed cost is ~$20/month (Hostinger $6 + Render $14 + Cloudflare $0.02) for production hosting.

**Q: What happens if we stop paying?**
A: Services will stop working. Customer orders will fail. Website will go offline. Must maintain subscriptions while business is active.

**Q: Do we need all 6 accounts?**
A: Yes, all are required for the app to function fully. Could technically skip OpenAI and remove AI features, but that's a major selling point. Hostinger is needed for frontend hosting, Render for backend.

---

## Next Steps

**For you (developer):**
1. Share this document with client
2. Wait for client to create accounts
3. Get access/API keys from client
4. Follow DEPLOYMENT_GUIDE.md to set everything up

**For client:**
1. Review costs and approve
2. Create all 5 accounts
3. Add payment methods
4. Share access with you
5. Wait for you to deploy

**Timeline:** ~1 week from approval to live website

---

## Contact Information

**Services support:**
- Render: support@render.com
- Cloudflare: https://support.cloudflare.com
- OpenAI: https://help.openai.com
- Stripe: https://support.stripe.com

**For deployment questions:** Contact you (the developer)

---

**Document version:** 1.0
**Last updated:** 2025-01-20
