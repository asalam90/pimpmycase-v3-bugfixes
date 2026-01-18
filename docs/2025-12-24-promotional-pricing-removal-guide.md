# Promotional Pricing Removal Guide

## Overview
Machine ID `16DCTRYUJSJH` is currently configured to offer FREE phone cases (£0.00) during a promotional period.

**Implementation Date:** 2025-12-24
**Machine ID:** `16DCTRYUJSJH`
**Pricing:** £0.00 (free - includes base case and all add-ons)

## When to Remove

When the promotional period ends, follow these steps to restore normal pricing.

---

## Step-by-Step Removal Instructions

### 1. Backend Configuration (CRITICAL)

Delete the promotional pricing configuration file:

```bash
rm backend/config/promotional_pricing.py
```

---

### 2. Backend Payment Routes (CRITICAL)

**File:** `/home/humanity/projects/pimpmycase-website/backend/routes/payment.py`

#### Change 1: Remove import (around line 6-8)
```python
# DELETE THIS LINE:
from backend.config.promotional_pricing import get_promotional_price, is_free_promotional_machine
```

#### Change 2: Remove promotional price override (search for "PROMOTIONAL")
Look for the block that starts with:
```python
# ============================================
# PROMOTIONAL: Override price for promotional machines
```

**DELETE this entire block:**
```python
# ============================================
# PROMOTIONAL: Override price for promotional machines
# TODO: Remove when promotional period ends
# ============================================
machine_id = request.machine_id or None
if machine_id and is_free_promotional_machine(machine_id):
    print(f"🎉 PROMOTIONAL: Free pricing for machine {machine_id}")
    amount_pence = 0
    amount_pounds = 0.00
# ============================================
```

---

### 3. Backend Vending Routes (CRITICAL)

**File:** `/home/humanity/projects/pimpmycase-website/backend/routes/vending.py`

#### Change 1: Remove import (around line 12-14)
```python
# DELETE THIS LINE:
from backend.config.promotional_pricing import get_promotional_price_pounds, is_free_promotional_machine
```

#### Change 2: Remove promotional price override (search for "PROMOTIONAL")
Look for the block that starts with:
```python
# ============================================
# PROMOTIONAL: Override payment for promotional machines
```

**DELETE this entire block:**
```python
# ============================================
# PROMOTIONAL: Override payment for promotional machines
# TODO: Remove when promotional period ends
# ============================================
if is_free_promotional_machine(session.machine_id):
    print(f"🎉 PROMOTIONAL: Free pricing for vending machine {session.machine_id}")
    payment_amount = 0.00
# ============================================
```

---

### 4. Frontend Configuration

**File:** `/home/humanity/projects/pimpmycase-website/src/config/templatePricing.js`

#### Remove promotional machine configuration (search for "FREE_MACHINES" or "PROMOTIONAL")

**DELETE this entire block (near end of file):**
```javascript
// ============================================
// PROMOTIONAL: Free machines configuration
// TODO: Remove when promotional period ends
// See PROMOTIONAL_PRICING_REMOVAL_GUIDE.md
// ============================================
export const FREE_MACHINE_IDS = [
  "16DCTRYUJSJH"
]

export const isFreePromoMachine = (machineId) => {
  if (!machineId) return false
  return FREE_MACHINE_IDS.includes(machineId.toUpperCase().trim())
}
```

---

### 5. Frontend Payment Screen

**File:** `/home/humanity/projects/pimpmycase-website/src/screens/PaymentScreen.jsx`

#### Change 1: Remove import (around line 4)
```javascript
// CHANGE FROM:
import { getTemplatePrice, getTemplatePricePence, isFreePromoMachine } from '../config/templatePricing'

// CHANGE TO:
import { getTemplatePrice, getTemplatePricePence } from '../config/templatePricing'
```

#### Change 2: Remove promotional price override (search for "PROMOTIONAL")

**DELETE this entire block (after line 125):**
```javascript
// ============================================
// PROMOTIONAL: Override all pricing for promotional machines
// TODO: Remove when promotional period ends
// ============================================
const machineId = vendingMachineSession?.machineId || vendingMachineSession?.deviceId
const isFreePromo = machineId && isFreePromoMachine(machineId)

let finalBasePricePence = basePricePence
let finalAddOnsPence = addOnsPence
let finalEffectivePricePence = effectivePricePence
let finalBasePrice = basePrice
let finalAddOnsTotal = addOnsTotal
let finalEffectivePrice = effectivePrice

if (isFreePromo) {
  console.log('🎉 PROMOTIONAL: Free pricing for machine', machineId)
  finalBasePricePence = 0
  finalAddOnsPence = 0
  finalEffectivePricePence = 0
  finalBasePrice = 0.00
  finalAddOnsTotal = 0.00
  finalEffectivePrice = 0.00
}
// ============================================
```

#### Change 3: Restore original price variables throughout file

Search for all instances of `final` price variables and replace with original:
- `finalBasePricePence` → `basePricePence`
- `finalAddOnsPence` → `addOnsPence`
- `finalEffectivePricePence` → `effectivePricePence`
- `finalBasePrice` → `basePrice`
- `finalAddOnsTotal` → `addOnsTotal`
- `finalEffectivePrice` → `effectivePrice`

Specific locations:
- Line ~322 (Stripe request): `amount_pence: effectivePricePence`
- Line ~283 (Chinese payData): `pay_amount: effectivePrice`
- Lines ~907, 941, 962, 990 (Price displays): Use `effectivePrice`, `basePrice`, `addOnsTotal`

#### Change 4: Remove promotional badge from collection notice (search for "FREE PROMOTIONAL CASE")

**DELETE this block:**
```javascript
{isFreePromo && (
  <div style={{
    backgroundColor: '#FF6B35',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '12px',
    display: 'inline-block'
  }}>
    🎉 FREE PROMOTIONAL CASE
  </div>
)}
```

Also restore the collection notice background color:
```javascript
// CHANGE FROM:
backgroundColor: isFreePromo ? '#FFF4E6' : '#E8F5E9',

// CHANGE TO:
backgroundColor: '#E8F5E9',
```

And restore the heading color:
```javascript
// CHANGE FROM:
color: isFreePromo ? '#C44D00' : '#2E7D32',

// CHANGE TO:
color: '#2E7D32',
```

And restore the message:
```javascript
// CHANGE FROM:
{isFreePromo
  ? "This is a FREE promotional case! After confirming, your case will print at the vending machine."
  : "After payment, your case will print at the vending machine you scanned. Please wait by the machine to collect your order."
}

// CHANGE TO:
After payment, your case will print at the vending machine you scanned. Please wait by the machine to collect your order.
```

---

## 6. Verify Removal

After making changes, verify all promotional code is removed:

### Search for promotional markers:
```bash
# Search for PROMOTIONAL markers
grep -r "PROMOTIONAL" backend/ src/

# Search for machine ID
grep -r "16DCTRYUJSJH" backend/ src/

# Search for promotional functions
grep -r "isFreePromo" src/
grep -r "promotional_pricing" backend/
```

**Expected result:** No matches found

---

## Files Modified Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/config/promotional_pricing.py` | **DELETE** | Promotional configuration |
| `backend/routes/payment.py` | **MODIFY** | Remove import + price override |
| `backend/routes/vending.py` | **MODIFY** | Remove import + price override |
| `src/config/templatePricing.js` | **MODIFY** | Remove FREE_MACHINE_IDS and function |
| `src/screens/PaymentScreen.jsx` | **MODIFY** | Remove price override logic + UI badges |
| `PROMOTIONAL_PRICING_REMOVAL_GUIDE.md` | **DELETE** | This file (after removal complete) |

---

## Testing After Removal

After removal, test these scenarios to ensure normal pricing restored:

### Test 1: QR Entry with Previously Promotional Machine
1. Visit: `http://localhost:5173/?qr=true&machine_id=16DCTRYUJSJH`
2. Design case
3. **✓ Verify:** Price shows **£35.00** (not £0.00)
4. Complete payment
5. **✓ Verify:** Stripe charges **£35.00**

### Test 2: QR Entry with Different Machine
1. Visit: `http://localhost:5173/?qr=true&machine_id=DIFFERENT123`
2. **✓ Verify:** Price shows **£35.00**

### Test 3: Vanilla Entry (No QR)
1. Visit: `http://localhost:5173/`
2. **✓ Verify:** Price shows **£35.00**

### Test 4: Add-ons Pricing
1. Design case and add screen protector
2. **✓ Verify:** Total = £35.00 + £7.99 = **£42.99**

### Test 5: Backend Logs
1. Check backend console during payment
2. **✓ Verify:** No "🎉 PROMOTIONAL" messages appear

---

## Rollback (If Issues After Removal)

If you encounter issues after removing promotional pricing:

### Quick Rollback:
```bash
# Restore from git
git checkout HEAD -- backend/config/promotional_pricing.py
git checkout HEAD -- backend/routes/payment.py
git checkout HEAD -- backend/routes/vending.py
git checkout HEAD -- src/config/templatePricing.js
git checkout HEAD -- src/screens/PaymentScreen.jsx

# Restart services
# Backend
python api_server.py

# Frontend
npm run dev
```

---

## Implementation Details (For Reference)

### What Was Changed:

**Backend:**
- Created `backend/config/promotional_pricing.py` with machine ID list
- Modified `backend/routes/payment.py` to override Stripe amounts to £0.00
- Modified `backend/routes/vending.py` to override vending machine amounts to £0.00

**Frontend:**
- Modified `src/config/templatePricing.js` to export promotional machine detection
- Modified `src/screens/PaymentScreen.jsx` to:
  - Override all prices to £0.00 for display
  - Override amounts sent to Stripe and Chinese API
  - Show "FREE PROMOTIONAL CASE" badge
  - Adjust collection notice styling

### How It Worked:

1. **Frontend Detection:** When user has `?machine_id=16DCTRYUJSJH` in URL, frontend detects it
2. **Frontend Override:** All prices set to £0.00 before display and API calls
3. **Backend Validation:** Backend checks machine_id and enforces £0.00 regardless of frontend
4. **Chinese API:** Receives `pay_amount: 0.00` for order submission
5. **Stripe:** Creates checkout session with £0.00 amount

---

## Support

If you encounter issues during removal:

1. Check git history: `git log --oneline --grep="promotional"`
2. Review this file: `PROMOTIONAL_PRICING_REMOVAL_GUIDE.md`
3. Search for markers: `PROMOTIONAL`, `16DCTRYUJSJH`, `isFreePromo`

---

**Removal checklist:**
- [ ] Delete `backend/config/promotional_pricing.py`
- [ ] Remove imports from `payment.py` and `vending.py`
- [ ] Remove PROMOTIONAL blocks from backend routes
- [ ] Remove `FREE_MACHINE_IDS` from `templatePricing.js`
- [ ] Remove promotional override from `PaymentScreen.jsx`
- [ ] Remove promotional UI elements from `PaymentScreen.jsx`
- [ ] Search codebase for "PROMOTIONAL" - no results
- [ ] Search codebase for "16DCTRYUJSJH" - no results
- [ ] Search codebase for "isFreePromo" - no results
- [ ] Test QR entry with 16DCTRYUJSJH - shows £35.00
- [ ] Test vanilla entry - shows £35.00
- [ ] Test Stripe payment - charges £35.00
- [ ] Delete `PROMOTIONAL_PRICING_REMOVAL_GUIDE.md`

---

**Estimated removal time:** 15-20 minutes
**Created:** 2025-12-24
**Last updated:** 2025-12-24
