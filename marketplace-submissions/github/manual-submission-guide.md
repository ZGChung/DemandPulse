# GitHub Marketplace Manual Submission Guide

This guide is for a future DemandPulse GitHub App or OAuth app.

## Go or no-go check

Do not start a Marketplace submission until all of the following are true:

- The app is public on GitHub.
- The app is a GitHub App or OAuth app.
- The app provides value beyond GitHub authentication alone.
- The team has a live privacy policy and support page.
- The app can handle GitHub Marketplace webhook events for plan changes and cancellations.

## Current blocker for DemandPulse

The repository currently contains a Claude Code plugin, not a GitHub Marketplace-compatible app. Submission is blocked until DemandPulse ships either:

- A GitHub App
- An OAuth app
- A GitHub Action, if the team chooses the Actions marketplace path instead

## Draft listing workflow

1. Create or publish the GitHub App or OAuth app and make sure it is public.
2. In GitHub, open `Settings` -> `Developer settings`.
3. Open `GitHub Apps` or `OAuth Apps`.
4. Select the app.
5. In the app settings page, use the `List in Marketplace` entry in the Marketplace section.
6. Complete the draft listing sections for descriptions, images, pricing, and contact info.
7. Configure the GitHub Marketplace webhook.
8. Review the overview page, accept the GitHub Marketplace Developer Agreement, and request publication.
9. Respond to GitHub's onboarding expert during review.

## Required listing content

- Listing name
- Primary category, and optional secondary category
- Support URL
- Privacy policy URL
- Pricing plan
- Valid contact information
- Logo
- Feature card
- Product screenshots
- Introductory description
- Optional detailed description

## Image guidance from GitHub docs

- Logo should be at least `200 x 200` pixels.
- A feature card is required.
- Screenshots are required.

## Pricing guidance

For a first submission, DemandPulse should use a free plan unless a GitHub-native paid product already exists.

Reasons:

- Free listings avoid publisher-verification requirements for launch.
- The current product does not have the installation volume needed for a paid GitHub Marketplace launch.
- Paid listings require more billing and webhook work.

## Paid-plan path if needed later

Before launching a paid plan:

- Transfer the app to a GitHub organization if it is owned by a personal account.
- Complete publisher verification for that organization.
- Verify the organization's domain.
- Enable two-factor authentication for the organization.
- Reach the minimum installation or user thresholds.
- Support monthly and annual billing.
- Handle new purchase, cancellation, upgrade, downgrade, and trial events.

## Recommended DemandPulse approach

If the goal is distribution growth in the GitHub ecosystem, the lowest-friction path is likely:

1. Build a lightweight GitHub App that links repositories, issues, or discussions to DemandPulse demand signals.
2. Launch the Marketplace listing as free.
3. Use the Marketplace listing as a discovery channel, not as the primary monetization surface.
