#!/bin/bash

# Script to automatically check CI/CD pipeline status
# Runs for up to 10 minutes or until pipeline passes

MAX_WAIT_MINUTES=10
CHECK_INTERVAL_SECONDS=10
MAX_CHECKS=$((MAX_WAIT_MINUTES * 60 / CHECK_INTERVAL_SECONDS))

echo "Starting CI/CD pipeline monitoring..."
echo "Will check every ${CHECK_INTERVAL_SECONDS} seconds for up to ${MAX_WAIT_MINUTES} minutes"

for ((i=1; i<=MAX_CHECKS; i++)); do
    echo ""
    echo "Check #${i} at $(date)"
    
    # Get latest run
    RUN_INFO=$(gh run list --workflow=ci.yml --limit 1 --json status,conclusion,url 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to get run info. Make sure GitHub CLI is authenticated."
        exit 1
    fi
    
    STATUS=$(echo "$RUN_INFO" | jq -r '.[0].status')
    CONCLUSION=$(echo "$RUN_INFO" | jq -r '.[0].conclusion')
    URL=$(echo "$RUN_INFO" | jq -r '.[0].url')
    
    echo "Status: $STATUS"
    echo "Conclusion: $CONCLUSION"
    echo "URL: $URL"
    
    if [ "$STATUS" = "completed" ]; then
        if [ "$CONCLUSION" = "success" ]; then
            echo "✅ CI/CD pipeline PASSED!"
            echo "Deployment should be available at: https://demand-pulse.vercel.app"
            exit 0
        else
            echo "❌ CI/CD pipeline FAILED!"
            echo "Check logs at: $URL"
            
            # Show failed job logs
            echo ""
            echo "Fetching failed job logs..."
            gh run view --log-failed "$(echo "$RUN_INFO" | jq -r '.[0].databaseId')" 2>/dev/null | head -100
            
            exit 1
        fi
    elif [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "queued" ]; then
        echo "⏳ Pipeline still running. Waiting ${CHECK_INTERVAL_SECONDS} seconds..."
        sleep $CHECK_INTERVAL_SECONDS
    else
        echo "Unknown status: $STATUS"
        sleep $CHECK_INTERVAL_SECONDS
    fi
done

echo ""
echo "⏰ Timeout after ${MAX_WAIT_MINUTES} minutes"
echo "Pipeline still not completed. Check manually at:"
echo "https://github.com/ZGChung/DemandPulse/actions"
exit 2