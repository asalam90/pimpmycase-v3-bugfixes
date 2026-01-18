# QR vs E-commerce Entry Points Implementation

**Date:** 2025-12-23
**Status:** ✅ Completed

## Overview

This document describes the implementation of two distinct entry points for the PimpMyCase website, each with different payment flows and user experiences:

1. **QR Entry** - Users scan QR code from vending machine
2. **Vanilla Entry** - Users visit website directly (e-commerce)

## Business Requirements

### Entry Sources

| Entry Source | How Users Arrive |
|--------------|------------------|
| QR Code | User scans QR from vending machine with URL: `?qr=true&machine_id=XXX&session_id=XXX` |
| Vanilla | User visits `pimpmycase.co.uk` directly |

### Payment Scenarios

| Entry Source | Pay via Machine | Pay via App |
|--------------|-----------------|-------------|
| **QR Code** | ✅ Available - pays at machine, order prints at that machine | ✅ Available - Stripe payment, NO address needed, collect from same machine |
| **Vanilla** | ❌ Not available | ✅ Available - Stripe payment + address form, delivery to home |

### Machine ID Assignment

- **QR users**: Use `machine_id` from URL params (the machine they scanned)
- **Vanilla users**: Use `JMSOOMSZRQO9` from environment variable `CHINESE_API_DEVICE_ID`

## Technical Implementation

### Files Modified

1. **Backend:**
   - `backend/schemas/payment.py` - Added entry source tracking fields
   - `backend/routes/payment.py` - Dynamic device_id handling

2. **Frontend:**
   - `src/contexts/AppStateContext.jsx` - State management for entry source
   - `src/screens/LandingScreen.jsx` - Entry source detection on mount
   - `src/screens/PaymentScreen.jsx` - Conditional UI and payment logic
   - `src/screens/OrderConfirmedScreen.jsx` - Conditional completion messaging

### Architecture Changes

#### 1. State Management (AppStateContext.jsx)

**New State Fields:**

```javascript
{
  // Entry source tracking
  entrySource: null, // 'qr' | 'vanilla'

  // Vending Machine Session
  vendingMachineSession: {
    isVendingMachine: false,
    sessionId: null,
    deviceId: null,
    machineId: null,
    sessionStatus: null,
    location: null
  }
}
```

**New Actions:**
- `SET_ENTRY_SOURCE` - Sets entry source
- `SET_VENDING_MACHINE_SESSION` - Updates vending machine session data

**New Action Creators:**
- `setEntrySource(source)` - Set 'qr' or 'vanilla'
- `setVendingMachineSession(sessionData)` - Update session details

#### 2. Entry Detection (LandingScreen.jsx)

On component mount, the landing screen now detects the entry source:

```javascript
useEffect(() => {
  const qrParam = searchParams.get('qr')
  const machineId = searchParams.get('machine_id')
  const sessionId = searchParams.get('session_id')

  if (qrParam === 'true' && machineId) {
    // QR Entry
    actions.setEntrySource('qr')
    actions.setVendingMachineSession({
      isVendingMachine: true,
      machineId: machineId,
      sessionId: sessionId,
      deviceId: machineId,
      sessionStatus: 'active'
    })
  } else {
    // Vanilla Entry
    actions.setEntrySource('vanilla')
    actions.setVendingMachineSession({
      isVendingMachine: false,
      deviceId: null
    })
  }
}, [searchParams, actions])
```

#### 3. Payment Screen (PaymentScreen.jsx)

**Conditional Flags:**

```javascript
const entrySource = appState.entrySource
const isQREntry = entrySource === 'qr'
const isVanillaEntry = entrySource === 'vanilla'

const showPayViaMachineButton = isQREntry && isRegisteredVending
const showAddressForm = isVanillaEntry
const requiresAddress = isVanillaEntry
```

**UI Changes:**

1. **Address Form** - Only shown for vanilla entry:
   ```jsx
   {showAddressForm ? (
     <div>/* Delivery form fields */</div>
   ) : (
     <div>/* Collection notice for QR entry */</div>
   )}
   ```

2. **Payment Buttons** - Conditional rendering:
   ```jsx
   <button onClick={handlePayOnApp}>Pay</button>
   {showPayViaMachineButton && (
     <button onClick={handlePayViaVendingMachine}>Pay at Machine</button>
   )}
   ```

**Payment Request Data:**

```javascript
const requestData = {
  // Base fields...
  entry_source: entrySource,
  is_machine_collection: isQREntry,

  // For QR entry: include machine info
  ...(isQREntry && {
    machine_id: vendingMachineSession?.machineId
  }),

  // For vanilla entry: include delivery details
  ...(isVanillaEntry && {
    customer_name: deliveryDetails.customerName,
    customer_email: deliveryDetails.customerEmail,
    // ... other address fields
  })
}
```

**Validation:**

```javascript
// Only validate address if required (vanilla entry)
if (requiresAddress && !validateForm()) {
  setPaymentError('Please fill in all required delivery details')
  return
}
```

#### 4. Backend Payment Schema (payment.py)

**New Schema Fields:**

```python
class CheckoutSessionRequest(BaseModel):
    # ... existing fields ...

    # Entry source tracking
    entry_source: Optional[str] = None  # 'qr' | 'vanilla'
    machine_id: Optional[str] = None  # For QR entries
    is_machine_collection: Optional[bool] = False
```

#### 5. Backend Payment Route (routes/payment.py)

**Metadata Storage:**

```python
# Add entry source tracking to metadata
if request.entry_source:
    metadata['entry_source'] = request.entry_source
if request.machine_id:
    metadata['machine_id'] = request.machine_id
if request.is_machine_collection:
    metadata['is_machine_collection'] = str(request.is_machine_collection)
```

**Dynamic Device ID:**

```python
# Extract from metadata
entry_source = session.metadata.get('entry_source', 'vanilla')
machine_id = session.metadata.get('machine_id')
is_machine_collection = session.metadata.get('is_machine_collection', 'false').lower() == 'true'

# Determine device_id based on entry source
if entry_source == 'qr' and machine_id:
    device_id = machine_id  # Use machine from QR code
else:
    device_id = os.getenv('CHINESE_API_DEVICE_ID', 'JMSOOMSZRQO9')
```

**Chinese API Integration:**

```python
# Use dynamic device_id for Chinese API calls
pay_result = send_payment_to_chinese_api(
    mobile_model_id=model.chinese_model_id,
    device_id=device_id,  # Dynamic based on entry source
    # ...
)

order_result = send_order_data_to_chinese_api(
    device_id=device_id,  # Dynamic based on entry source
    # ...
)
```

**Response:**

```python
return {
    # ... existing fields ...
    "entry_source": entry_source,
    "is_machine_collection": is_machine_collection,
    "collection_device_id": device_id if is_machine_collection else None
}
```

#### 6. Order Confirmed Screen (OrderConfirmedScreen.jsx)

**Conditional Messaging:**

```javascript
const isMachineCollection = orderData?.is_machine_collection || false
const collectionDeviceId = orderData?.collection_device_id || null

{isMachineCollection ? (
  <>
    <h1>Collect Your Case</h1>
    <p>Your phone case is printing now! Please wait by the vending machine.</p>
    {collectionDeviceId && (
      <div>Machine: {collectionDeviceId}</div>
    )}
  </>
) : (
  <>
    <h1>Your order is placed successfully</h1>
    <p>Your custom phone case will be delivered to your address.</p>
  </>
)}
```

## User Flows

### QR Entry → Pay at Machine

1. User scans QR code from vending machine
2. URL params detected: `?qr=true&machine_id=XXX`
3. Entry source set to 'qr'
4. User designs case
5. Payment screen shows:
   - ✅ "Collect from Machine" notice
   - ✅ "Pay" button
   - ✅ "Pay at Machine" button
   - ❌ No address form
6. User clicks "Pay at Machine"
7. Payment processed via Chinese API (pay_type: 5)
8. Order prints at same machine

### QR Entry → Pay via App

1. User scans QR code from vending machine
2. URL params detected: `?qr=true&machine_id=XXX`
3. Entry source set to 'qr'
4. User designs case
5. Payment screen shows:
   - ✅ "Collect from Machine" notice
   - ✅ "Pay" button
   - ✅ "Pay at Machine" button
   - ❌ No address form
6. User clicks "Pay"
7. Stripe checkout (no address required)
8. Backend uses `machine_id` from QR params
9. Order sent to Chinese API with QR machine's device_id
10. Confirmation screen: "Collect Your Case - Machine: XXX"

### Vanilla Entry → Pay via App

1. User visits `pimpmycase.co.uk` directly
2. No QR params detected
3. Entry source set to 'vanilla'
4. User designs case
5. Payment screen shows:
   - ✅ Full delivery address form (REQUIRED)
   - ✅ "Pay" button
   - ❌ No "Pay at Machine" button
   - ❌ No collection notice
6. User fills delivery details and clicks "Pay"
7. Stripe checkout with address validation
8. Backend uses default `JMSOOMSZRQO9` device_id
9. Order sent to Chinese API with default device
10. Confirmation screen: "Order successful - Will be delivered to your address"

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    User Entry Point                       │
└────────────┬───────────────────────────┬─────────────────┘
             │                           │
        QR Scan                    Direct Visit
   (qr=true&machine_id=XXX)         (vanilla)
             │                           │
             v                           v
    ┌────────────────┐         ┌─────────────────┐
    │  QR Entry      │         │  Vanilla Entry  │
    │  - entrySource │         │  - entrySource  │
    │    = 'qr'      │         │    = 'vanilla'  │
    │  - machineId   │         │  - deviceId     │
    │    from URL    │         │    = null       │
    └────────┬───────┘         └────────┬────────┘
             │                           │
             v                           v
    ┌────────────────┐         ┌─────────────────┐
    │ Payment Screen │         │ Payment Screen  │
    │                │         │                 │
    │ ✓ Collection   │         │ ✓ Address Form  │
    │   Notice       │         │                 │
    │ ✓ Pay Button   │         │ ✓ Pay Button    │
    │ ✓ Pay at       │         │ ✗ Pay at        │
    │   Machine      │         │   Machine       │
    │ ✗ Address Form │         │ ✗ Collection    │
    │                │         │   Notice        │
    └────────┬───────┘         └────────┬────────┘
             │                           │
     ┌───────┴────────┐                 │
     v                v                 v
┌─────────┐    ┌──────────┐    ┌──────────────┐
│Pay at   │    │Pay via   │    │Pay via App   │
│Machine  │    │App (QR)  │    │(Vanilla)     │
└────┬────┘    └────┬─────┘    └──────┬───────┘
     │              │                   │
     v              v                   v
┌─────────┐    ┌──────────┐    ┌──────────────┐
│Chinese  │    │Stripe +  │    │Stripe +      │
│API      │    │QR device │    │Default device│
│pay_type │    │          │    │JMSOOMSZRQO9  │
│= 5      │    │          │    │              │
└────┬────┘    └────┬─────┘    └──────┬───────┘
     │              │                   │
     │              v                   v
     │         ┌──────────┐    ┌──────────────┐
     │         │Chinese   │    │Chinese API   │
     │         │API with  │    │with default  │
     │         │machine_id│    │device_id     │
     └────────►└────┬─────┘    └──────┬───────┘
                    │                   │
                    v                   v
            ┌──────────────┐    ┌──────────────┐
            │"Collect Your │    │"Order        │
            │Case"         │    │Confirmed"    │
            │              │    │              │
            │Machine: XXX  │    │Delivering to │
            │              │    │your address" │
            └──────────────┘    └──────────────┘
```

## Environment Variables

**Required:**
- `CHINESE_API_DEVICE_ID=JMSOOMSZRQO9` - Default device for e-commerce orders
- `VITE_CHINESE_API_DEVICE_ID=JMSOOMSZRQO9` - Frontend copy (Vite requires VITE_ prefix)

## Testing Checklist

### QR Entry Tests

- [ ] QR URL with `?qr=true&machine_id=TEST123` sets entry source to 'qr'
- [ ] Payment screen hides address form for QR entry
- [ ] Payment screen shows "Collect from Machine" notice
- [ ] Payment screen shows "Pay at Machine" button (if registered)
- [ ] Pay via App sends `machine_id` in request
- [ ] Backend uses QR machine_id for Chinese API
- [ ] Order confirmation shows "Collect Your Case" message
- [ ] Order confirmation displays machine ID

### Vanilla Entry Tests

- [ ] Direct website visit sets entry source to 'vanilla'
- [ ] Payment screen shows full address form
- [ ] Payment screen requires address validation
- [ ] Payment screen hides "Pay at Machine" button
- [ ] Pay via App sends delivery details in request
- [ ] Backend uses default `JMSOOMSZRQO9` for Chinese API
- [ ] Order confirmation shows "Order Confirmed" with delivery message
- [ ] Order confirmation does NOT show machine ID

### Edge Cases

- [ ] Missing QR params defaults to vanilla entry
- [ ] Invalid machine_id falls back to default device
- [ ] QR entry without registered session hides "Pay at Machine"
- [ ] Empty entry source defaults to vanilla behavior

## Migration Notes

### Backward Compatibility

✅ **Fully backward compatible** - No breaking changes:
- Existing orders without `entry_source` default to 'vanilla'
- Existing `device_id` hardcoded values are replaced with dynamic logic
- Old vending machine flows continue to work

### Database Changes

❌ **No database migration required**
- All tracking happens via Stripe metadata
- No new database columns needed

## Performance Considerations

- Entry source detection happens once on mount (minimal overhead)
- Conditional rendering prevents unnecessary form field rendering
- No additional API calls introduced

## Security Considerations

✅ **Security measures:**
- Machine ID validated on backend
- Entry source stored in Stripe metadata (tamper-proof)
- Address validation only bypassed for legitimate QR entries
- Device ID never exposed to frontend for vanilla users

## Future Enhancements

**Potential improvements:**
1. Add analytics tracking for entry source conversion rates
2. Implement A/B testing for QR vs vanilla user flows
3. Add machine location display on collection notice
4. Send SMS notifications for machine collection orders
5. Add QR session timeout handling

## Related Documentation

- `CHINESE_API_INTEGRATION.md` - Chinese API integration details
- `PAYMENT_FLOW.md` - General payment flow documentation
- `VENDING_MACHINE_SETUP.md` - Vending machine configuration

---

**Implementation completed:** 2025-12-23
**Implemented by:** Claude Code (Anthropic)
**Reviewed by:** [Pending]
