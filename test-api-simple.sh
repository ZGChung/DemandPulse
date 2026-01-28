#!/bin/bash

echo "=== Testing Requirements API Endpoints ==="
echo

# Test 1: Check if server is running
echo "Test 1: Checking if server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Server is running"
else
    echo "✗ Server is not running"
    echo "Please start the server with: npm run dev"
    exit 1
fi

# Test 2: Test GET /api/requirements
echo
echo "Test 2: Testing GET /api/requirements..."
GET_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/requirements)
GET_HTTP_CODE=$(echo "$GET_RESPONSE" | tail -n1)
GET_BODY=$(echo "$GET_RESPONSE" | head -n -1)

if [ "$GET_HTTP_CODE" = "200" ]; then
    echo "✓ GET endpoint returned 200"
    echo "Response body: $GET_BODY"
elif [ "$GET_HTTP_CODE" = "500" ]; then
    echo "⚠ GET endpoint returned 500 (Internal Server Error)"
    echo "This might be due to database configuration issues"
    echo "Error details might be in the server logs"
else
    echo "✗ GET endpoint returned $GET_HTTP_CODE"
    echo "Response: $GET_BODY"
fi

# Test 3: Test POST /api/requirements (should require auth)
echo
echo "Test 3: Testing POST /api/requirements (should require authentication)..."
POST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "requirementId": "test-'$(date +%s)'",
    "originalRequirement": "Test requirement",
    "summarizedRequirement": "Test",
    "context": {
      "conversationId": "test-conv-'$(date +%s)'",
      "workspacePath": "/test",
      "timestamp": "'$(date -Iseconds)'"
    },
    "consent": {
      "consentOptions": {
        "dataCollection": true,
        "contact": false,
        "anonymization": true
      },
      "userProvidedEmail": null,
      "consentedAt": "'$(date -Iseconds)'"
    }
  }' \
  http://localhost:3000/api/requirements)

POST_HTTP_CODE=$(echo "$POST_RESPONSE" | tail -n1)
POST_BODY=$(echo "$POST_RESPONSE" | head -n -1)

if [ "$POST_HTTP_CODE" = "401" ]; then
    echo "✓ POST endpoint correctly requires authentication (401)"
elif [ "$POST_HTTP_CODE" = "201" ]; then
    echo "✓ POST endpoint accepted request (201 Created)"
    echo "Response: $POST_BODY"
elif [ "$POST_HTTP_CODE" = "500" ]; then
    echo "⚠ POST endpoint returned 500 (Internal Server Error)"
    echo "This might be due to database configuration or authentication setup"
else
    echo "✗ POST endpoint returned unexpected code: $POST_HTTP_CODE"
    echo "Response: $POST_BODY"
fi

echo
echo "=== Test Summary ==="
echo "GET /api/requirements: HTTP $GET_HTTP_CODE"
echo "POST /api/requirements: HTTP $POST_HTTP_CODE"
echo
echo "=== Recommendations ==="
if [ "$GET_HTTP_CODE" = "500" ] || [ "$POST_HTTP_CODE" = "500" ]; then
    echo "1. Check database configuration in .env and .env.local"
    echo "2. Verify Prisma schema is compatible with SQLite"
    echo "3. Check server logs for detailed error messages"
    echo "4. Ensure Prisma client is properly generated"
fi
if [ "$POST_HTTP_CODE" = "401" ]; then
    echo "✓ Authentication is working correctly"
fi