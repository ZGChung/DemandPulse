# Linear Marketplace Submission Package

This package is prepared for Linear's Integration Directory submission flow for DemandPulse.

## What this package contains

- `research-notes.md`: Confirmed publication requirements from Linear's docs, plus clearly labeled inferences from public integration pages.
- `submission-form-draft.md`: Submission-ready copy mapped to the public Integration Directory page structure.
- `asset-brief.md`: Asset list, recommended screenshot plan, and production notes for the design handoff.
- `email-draft.txt`: Draft email to `integrations@linear.app` for the asset submission step.

## Current submission path

Linear does not expose a self-serve app store workflow in its docs. The documented process is:

1. Build the integration with Linear's API, preferably using OAuth.
2. Fill out Linear's submission form.
3. Send assets to `integrations@linear.app` or include an asset link in the form.

## Important constraint

DemandPulse currently ships a Claude Code plugin, not a native Linear integration. This package positions DemandPulse as a requirement-intelligence integration that can push AI-discovered demand signals into Linear, but an actual Linear OAuth integration still needs to exist before submission.
