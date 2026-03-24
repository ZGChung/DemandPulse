# GitHub Marketplace Submission Package

This package documents the manual submission path for GitHub Marketplace.

## Current viability

DemandPulse cannot be listed on GitHub Marketplace as the current Claude Code plugin alone. GitHub Marketplace listings are for GitHub Apps, OAuth apps, and GitHub Actions. The existing `claude-plugin-demandpulse/` package does not meet that product shape.

This package is therefore a manual submission playbook for a future `DemandPulse for GitHub` app, or for a GitHub Action if the team decides to package DemandPulse workflows that way.

## What GitHub requires

- A public GitHub App or OAuth app before a draft listing can be created.
- Required listing fields including support URL, privacy policy URL, pricing plan, and valid contact information.
- Images for logo, feature card, and screenshots.
- Marketplace webhook handling for plan changes and cancellations.
- Agreement acceptance and a review request from the listing overview page.

## Important paid-plan constraints

- Paid apps must be owned by a verified publisher organization.
- Publisher verification requires organization ownership, two-factor authentication, and a verified domain.
- Paid GitHub Apps need at least 100 installations before publication.
- Paid OAuth apps need at least 200 users before publication.

## Files in this package

- `manual-submission-guide.md`: Step-by-step GitHub Marketplace process.
- `listing-draft.md`: Draft listing copy and required field checklist.
- `sources.md`: Research notes and source URLs.
