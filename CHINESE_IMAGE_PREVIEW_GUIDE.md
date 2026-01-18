# Chinese API - Image Preview & Debug Guide

**Purpose:** View the exact images and URLs that are sent to Chinese manufacturing API

---

## 🖼️ Available Debug Endpoints

### 1. Preview All Images for an Order
**Endpoint:** `GET /api/chinese/debug/order-images/{order_id}`

Shows all images associated with an order and the URLs that would be sent to Chinese API.

**Example:**
```bash
curl http://localhost:8000/api/chinese/debug/order-images/ORDER_ID_HERE
```

**Response:**
```json
{
  "success": true,
  "order_id": "abc123",
  "order_number": "PMC-00001",
  "chinese_order_id": "CN_ORDER_123",
  "total_images": 2,
  "images": [
    {
      "image_id": "img_001",
      "image_type": "final",
      "filename": "design_final.png",
      "local_path": "/path/to/design_final.png",
      "chinese_api_url": "https://pimpmycase.onrender.com/image/design_final.png?token=abc123...",
      "base_url": "https://pimpmycase.onrender.com/image/design_final.png",
      "token_expiry_hours": 48
    }
  ]
}
```

---

### 2. Test Image URL Generation
**Endpoint:** `GET /api/chinese/debug/test-image-url?image_filename=FILE.png`

Test what URL would be generated for any image filename.

**Example:**
```bash
curl "http://localhost:8000/api/chinese/debug/test-image-url?image_filename=test-design.png"
```

**Response:**
```json
{
  "success": true,
  "filename": "test-design.png",
  "base_url": "https://pimpmycase.onrender.com/image/test-design.png",
  "authenticated_url": "https://pimpmycase.onrender.com/image/test-design.png?token=12345...",
  "token": "12345...",
  "token_expiry_hours": 48,
  "partner_type": "chinese_manufacturing",
  "usage": "This URL would be sent to Chinese API in the 'pic' field"
}
```

---

### 3. Preview Complete Chinese API Payload
**Endpoint:** `GET /api/orders/{order_id}/chinese-submission-preview`

Shows the EXACT payload that would be sent to Chinese manufacturing API.

**Example:**
```bash
curl http://localhost:8000/api/orders/ORDER_ID_HERE/chinese-submission-preview
```

**Response:**
```json
{
  "success": true,
  "order_id": "abc123",
  "order_number": "PMC-00001",
  "order_status": "paid",
  "chinese_api_endpoint": "https://api.inkele.net/mobileShell/en/order/orderData",
  "payload": {
    "third_pay_id": "MSPY10250830000008",
    "third_id": "PYEN250830540573",
    "mobile_model_id": "MM020250224000011",
    "pic": "https://pimpmycase.onrender.com/image/design.png?token=...",
    "device_id": "JMSOOMSZRQO9",
    "mobile_shell_id": "MS_DEFAULT"
  },
  "image_details": {
    "filename": "design.png",
    "local_path": "/generated-images/design.png",
    "chinese_url": "https://pimpmycase.onrender.com/image/design.png?token=...",
    "token_valid_for": "48 hours"
  },
  "model_details": {
    "model_name": "iPhone 15 Pro Max",
    "chinese_model_id": "MM020250224000011",
    "brand_id": "iphone"
  }
}
```

---

## 🔍 How to View Images Being Sent

### Step 1: Find an Order ID

**Option A: From database**
```bash
curl http://localhost:8000/api/admin/orders | python3 -c "import json,sys; orders = json.load(sys.stdin)['orders']; print('Recent Orders:'); [print(f'  {o[\"order_number\"]} - {o[\"id\"]}') for o in orders[:5]]"
```

**Option B: After making a test order**
The order ID is returned when you complete a payment.

---

### Step 2: Preview the Images

```bash
# Replace ORDER_ID with actual order ID
ORDER_ID="your-order-id-here"

# Get all images for the order
curl http://localhost:8000/api/chinese/debug/order-images/$ORDER_ID | python3 -m json.tool

# Get the complete payload preview
curl http://localhost:8000/api/orders/$ORDER_ID/chinese-submission-preview | python3 -m json.tool
```

---

### Step 3: View the Actual Image

The `chinese_api_url` from the response is a publicly accessible URL (with authentication token). You can:

**1. Open in browser:**
```
Copy the URL from chinese_api_url and paste it in your browser
```

**2. Download with curl:**
```bash
IMAGE_URL="paste-the-chinese_api_url-here"
curl -o preview.png "$IMAGE_URL"
open preview.png  # macOS
xdg-open preview.png  # Linux
```

**3. View directly:**
```bash
# The URL format is:
https://pimpmycase.onrender.com/image/FILENAME.png?token=SECURE_TOKEN

# Example:
https://pimpmycase.onrender.com/image/order_123_final.png?token=1234567890:abcdef...
```

---

## 📊 Image Submission Flow

```
User completes order
       ↓
Payment confirmed via Stripe
       ↓
Order created in database
       ↓
Final design image saved to /generated-images/
       ↓
Secure 48h token generated
       ↓
Authenticated URL created:
  https://pimpmycase.onrender.com/image/FILENAME.png?token=TOKEN
       ↓
URL sent to Chinese API in 'pic' field
       ↓
Chinese manufacturing downloads image
       ↓
Phone case printed
```

---

## 🔒 Security Details

### Token-Based Authentication
- **Type:** HMAC-SHA256 signature
- **Expiry:** 48 hours (chinese_manufacturing partner type)
- **Format:** `timestamp:signature`
- **Access:** Chinese API can download within 48 hours

### URL Format
```
Base URL:    https://pimpmycase.onrender.com/image/[filename]
Token:       ?token=[timestamp]:[signature]
Full URL:    https://pimpmycase.onrender.com/image/design.png?token=1702531234:abc123...
```

---

## 🧪 Testing Image Submission

### Test with a Sample Order

```bash
# 1. Create a test order (use frontend or API)
# 2. Get the order ID
# 3. Preview what would be sent to Chinese API

curl http://localhost:8000/api/orders/YOUR_ORDER_ID/chinese-submission-preview \
  | python3 -m json.tool \
  | tee chinese_payload.json

# 4. Extract the image URL
cat chinese_payload.json | python3 -c "import json,sys; print(json.load(sys.stdin)['image_details']['chinese_url'])"

# 5. Download and view the image
IMAGE_URL=$(cat chinese_payload.json | python3 -c "import json,sys; print(json.load(sys.stdin)['image_details']['chinese_url'])")
curl -o test_image.png "$IMAGE_URL"
echo "Image saved to test_image.png"
```

---

## 📝 Example Usage

### Get Image from Latest Order
```bash
#!/bin/bash

# Get latest order
LATEST_ORDER=$(curl -s http://localhost:8000/api/admin/orders | python3 -c "import json,sys; print(json.load(sys.stdin)['orders'][0]['id'])")

echo "Latest Order ID: $LATEST_ORDER"

# Preview Chinese API submission
curl -s "http://localhost:8000/api/orders/$LATEST_ORDER/chinese-submission-preview" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)

print('\n=== Chinese API Submission Preview ===')
print(f'Order: {data[\"order_number\"]}')
print(f'Model: {data[\"model_details\"][\"model_name\"]}')
print(f'\nImage URL:')
print(data['image_details']['chinese_url'])
print(f'\nFull Payload:')
print(json.dumps(data['payload'], indent=2))
"
```

---

## 🖼️ Image Requirements for Chinese API

### Format Requirements
- **File Type:** PNG or JPG
- **Dimensions:** 1024x1536 (portrait) or custom based on phone model
- **Color Mode:** RGB
- **Max File Size:** ~10MB (typical)

### URL Requirements
- **Must be publicly accessible** (Chinese API downloads it)
- **Must include authentication token**
- **Must be valid for at least 24-48 hours**
- **Must return proper Content-Type header**

---

## 🔧 Troubleshooting

### Image URL Not Working
```bash
# Check if image exists
ORDER_ID="your-order-id"
curl -s http://localhost:8000/api/chinese/debug/order-images/$ORDER_ID \
  | python3 -c "import json,sys; data=json.load(sys.stdin); print('Images found:', data['total_images']); [print(f'  - {img[\"image_type\"]}: {img[\"filename\"]}') for img in data['images']]"
```

### Token Expired
```bash
# Regenerate token for an image
curl "http://localhost:8000/api/chinese/debug/test-image-url?image_filename=YOUR_FILE.png"
```

### Image Not Found in Order
```bash
# Check order images
curl http://localhost:8000/api/chinese/debug/order-images/ORDER_ID | python3 -m json.tool
```

---

## 📍 Quick Reference

| Task | Endpoint | Method |
|------|----------|--------|
| View all images for order | `/api/chinese/debug/order-images/{order_id}` | GET |
| Test URL generation | `/api/chinese/debug/test-image-url?image_filename=file.png` | GET |
| Preview Chinese payload | `/api/orders/{order_id}/chinese-submission-preview` | GET |
| Download image | Use `chinese_api_url` from response | Browser/curl |

---

## 🎯 Next Steps

1. **Create a test order** via the frontend
2. **Get the order ID** from the payment response
3. **Use the preview endpoint** to see what images will be sent
4. **Download and verify** the image looks correct
5. **Submit to Chinese API** (happens automatically on payment)

---

**Last Updated:** 2025-12-14
**Documentation:** Complete image preview system for Chinese API integration
