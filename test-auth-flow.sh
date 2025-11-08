#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"

echo "Testing Auth Flow Integration"
echo "=============================="
echo ""

# Test 1: Check if backend is running
echo -n "1. Testing backend health... "
if curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL" | grep -q "200\|404"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "   Start backend with: cd apps/api && npm run start:dev"
    exit 1
fi

# Test 2: Test GET /auth/google
echo -n "2. Testing GET /auth/google... "
RESPONSE=$(curl -s "$API_BASE_URL/auth/google")
if echo "$RESPONSE" | grep -q "authUrl"; then
    echo -e "${GREEN}✓ Returns authUrl${NC}"
    echo "   Response: $(echo $RESPONSE | jq -c '.' 2>/dev/null || echo $RESPONSE)"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "   Response: $RESPONSE"
fi

# Test 3: Test GET /auth/me without auth (should fail)
echo -n "3. Testing GET /auth/me without auth... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/auth/me")
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Returns 401 (expected)${NC}"
else
    echo -e "${YELLOW}⚠ Got HTTP $HTTP_CODE (expected 401)${NC}"
fi

# Test 4: Check CORS headers
echo -n "4. Testing CORS configuration... "
CORS_HEADER=$(curl -s -I -X OPTIONS "$API_BASE_URL/auth/google" -H "Origin: http://localhost:5173" | grep -i "access-control-allow-credentials")
if echo "$CORS_HEADER" | grep -q "true"; then
    echo -e "${GREEN}✓ CORS allows credentials${NC}"
else
    echo -e "${YELLOW}⚠ CORS might not be configured correctly${NC}"
fi

echo ""
echo "=============================="
echo "Basic tests complete!"
echo ""
echo "Next steps:"
echo "1. Ensure .env file is configured with:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo ""
echo "2. Start frontend: cd apps/web && npm run dev"
echo "3. Open browser: http://localhost:5173/login"
echo "4. Test Google OAuth flow manually"
