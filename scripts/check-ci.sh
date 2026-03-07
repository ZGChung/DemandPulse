#!/usr/bin/env bash
# Check CI/CD status: GitHub Actions and (optionally) Vercel.
# Usage: ./scripts/check-ci.sh
# Exit 0 if all pass, 1 if any failed (so CI can "fail" and e.g. notify).

set -e
REPO="${GITHUB_REPOSITORY:-ZGChung/DemandPulse}"

echo "Checking GitHub Actions for $REPO..."
if ! command -v gh &>/dev/null; then
  echo "gh CLI not found; install from https://cli.github.com/"
  exit 1
fi

# Latest run on default branch
RUN=$(gh run list --limit 1 --json status,conclusion,name --jq '.[0]')
STATUS=$(echo "$RUN" | jq -r '.status')
CONC=$(echo "$RUN" | jq -r '.conclusion')

if [[ "$STATUS" != "completed" ]]; then
  echo "Latest run still in progress: $STATUS"
  exit 0
fi

if [[ "$CONC" == "failure" ]]; then
  echo "CI failed. Re-run tests locally: npm test"
  echo "Then fix and push. To see logs: gh run view --log-failed"
  exit 1
fi

echo "CI status: $CONC"
exit 0
