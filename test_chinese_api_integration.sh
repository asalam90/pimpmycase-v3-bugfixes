#!/bin/bash

# Chinese API Integration Test Script
# This script tests all the Chinese API integration points

echo "========================================="
echo "PimpMyCase - Chinese API Integration Tests"
echo "========================================="
echo ""

BASE_URL="http://localhost:8000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_passed=0
test_failed=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected=$3

    echo -n "Testing: $name... "
    response=$(curl -s "$BASE_URL$endpoint")

    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((test_passed++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        ((test_failed++))
    fi
}

echo "=== 1. Server Health Check ==="
test_endpoint "Health endpoint" "/health" "healthy"
echo ""

echo "=== 2. Chinese API Integration ==="
test_endpoint "Chinese API connection test" "/api/chinese/test-connection" "Chinese manufacturer API"
echo ""

echo "=== 3. Hybrid Brand/Model Fetching ==="
test_endpoint "Brands endpoint (hybrid)" "/api/brands" "success"
test_endpoint "iPhone models (hybrid)" "/api/brands/iphone/models" "success"
test_endpoint "Samsung models (hybrid)" "/api/brands/samsung/models" "success"
echo ""

echo "=== 4. Direct Chinese API Endpoints ==="
test_endpoint "Chinese brands (direct)" "/api/chinese/brands" "Authentication failed"
echo -e "${YELLOW}Note: Authentication failure is expected without credentials${NC}"
echo ""

echo "=== 5. Template Endpoints ==="
test_endpoint "Templates list" "/api/templates" "success"
echo ""

echo "=== 6. Vending Machine Endpoints ==="
echo "Creating vending session..."
session_response=$(curl -s -X POST "$BASE_URL/api/vending/create-session" \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": "VM001",
    "session_duration_minutes": 30,
    "qr_data": {"test": "integration"}
  }')

session_id=$(echo "$session_response" | python3 -c "import json, sys; print(json.load(sys.stdin).get('session_id', 'FAILED'))" 2>/dev/null)

if [ "$session_id" != "FAILED" ]; then
    echo -e "${GREEN}✓ Session created: $session_id${NC}"
    ((test_passed++))

    # Test session status
    test_endpoint "Session status" "/api/vending/session/$session_id/status" "active"
else
    echo -e "${RED}✗ Failed to create session${NC}"
    ((test_failed++))
fi
echo ""

echo "=== 7. Data Verification ==="
echo "Checking database for iPhone 15 models..."
models=$(curl -s "$BASE_URL/api/brands/iphone/models" | python3 -c "
import json, sys
data = json.load(sys.stdin)
iphone_15_models = [m for m in data.get('models', []) if '15' in m.get('display_name', '')]
for m in iphone_15_models:
    print(f\"  - {m['display_name']}: {m.get('chinese_model_id', 'NO_CHINESE_ID')}\")
" 2>/dev/null)

if [ ! -z "$models" ]; then
    echo -e "${GREEN}✓ iPhone 15 models found:${NC}"
    echo "$models"
    ((test_passed++))
else
    echo -e "${RED}✗ No iPhone 15 models found${NC}"
    ((test_failed++))
fi
echo ""

echo "=== 8. Integration Summary ==="
echo "Checking installed components..."

# Check if files exist
components=(
    "backend/services/chinese_payment_service.py:Chinese Payment Service"
    "backend/services/chinese_api_service.py:Chinese API Service"
    "backend/routes/chinese_api.py:Chinese API Routes"
    "backend/routes/vending.py:Vending Machine Routes"
    "backend/schemas/chinese_api.py:Chinese API Schemas"
)

for component in "${components[@]}"; do
    file="${component%%:*}"
    name="${component##*:}"
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $name"
    else
        echo -e "  ${RED}✗${NC} $name (missing)"
    fi
done
echo ""

echo "========================================="
echo "Test Results Summary"
echo "========================================="
echo -e "Tests Passed: ${GREEN}$test_passed${NC}"
echo -e "Tests Failed: ${RED}$test_failed${NC}"
echo ""

if [ $test_failed -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Chinese API integration is working.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Check the output above.${NC}"
    exit 1
fi
