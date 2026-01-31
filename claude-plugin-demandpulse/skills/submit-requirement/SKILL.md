---
name: submit-requirement
description: Submit a requirement to DemandPulse for analysis and tracking. Use when you've discussed a feature request, bug fix, or improvement that should be tracked as a product requirement.
---

Collect the current conversation context and submit it as a requirement to DemandPulse.

When this skill is invoked:

1. **Extract the requirement**: Identify the main requirement being discussed in the conversation. This could be a feature request, bug fix, improvement suggestion, or new tool request.

2. **Summarize the requirement**: Create a concise summary of the requirement that captures the essence of what's needed.

3. **Collect context**: Gather relevant context including:
   - The current conversation ID
   - Workspace path (if available)
   - Timestamp
   - Any relevant code snippets or technical details discussed

4. **Present consent options**: Inform the user about data collection and privacy options:
   - Data collection consent (required)
   - Contact consent (optional, for follow-up)
   - Anonymization option (optional)

5. **Submit to DemandPulse**: Use the DemandPulse API to submit the requirement with the collected context and consent choices.

6. **Confirm submission**: Provide the user with a confirmation message including the requirement ID and retention period.

The skill should handle the submission process transparently while respecting user privacy and consent preferences.
