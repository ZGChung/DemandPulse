#!/usr/bin/env bash
set -e
API_URL="${DEMANDPULSE_API_URL:-http://localhost:3000}"
API_KEY="${PLUGIN_API_KEY:-}"
[ -n "$API_KEY" ] || { echo "PLUGIN_API_KEY required"; exit 1; }
REQ_ID="e2e-$(date +%s)-$$"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD="{\"requirementId\":\"$REQ_ID\",\"originalRequirement\":\"E2E dark mode\",\"summarizedRequirement\":\"Add dark mode\",\"context\":{\"conversationId\":\"e2e-$REQ_ID\",\"timestamp\":\"$NOW\"},\"consent\":{\"requirementId\":\"$REQ_ID\",\"consentOptions\":{\"dataCollection\":true,\"contact\":false,\"anonymization\":true},\"consentedAt\":\"$NOW\"}}"
HTTP=$(curl -s -o /tmp/e2e-body -w "%{http_code}" -X POST "$API_URL/api/plugin/requirements" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$PAYLOAD")
[ "$HTTP" = "200" ] || [ "$HTTP" = "201" ] || { echo "FAIL HTTP $HTTP"; cat /tmp/e2e-body; exit 1; }
echo "E2E plugin API OK ($HTTP)"
