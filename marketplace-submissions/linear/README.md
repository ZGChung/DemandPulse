# Linear Marketplace Submission Package

This package prepares a manual submission for Linear's Integration Directory.

## Current viability

DemandPulse cannot be submitted to Linear as-is today. Linear accepts integrations built on its API, recommends OAuth-based apps, and generally accepts products from formal companies rather than standalone scripts or hobby projects. The existing `claude-plugin-demandpulse/` package is a Claude Code plugin, not a Linear integration.

That means this package should be treated as a submission starter for a future `DemandPulse for Linear` integration, not an immediately publishable artifact.

## What Linear requires

- A real Linear integration built on the Linear API, ideally using OAuth.
- Submission through Linear's Google Form.
- Assets sent to `integrations@linear.app` or linked in the form.
- Marketplace-style copy that matches the structure used on existing Linear integration pages.
- A company-backed product with clear user value for the Linear community.

## Files in this package

- `submission-draft.md`: Prefilled copy for a future Linear directory listing.
- `asset-brief.md`: Asset checklist and content guidance for the submission.
- `sources.md`: Research notes and source URLs.

## Recommended next step before submission

Build a minimal Linear OAuth integration that does all of the following:

- Connects a Linear workspace to DemandPulse.
- Pulls issue metadata or links requirement records back to Linear issues.
- Gives workspace admins a clear install and configuration flow.
- Has a production landing page, privacy policy, support email, and asset set.
