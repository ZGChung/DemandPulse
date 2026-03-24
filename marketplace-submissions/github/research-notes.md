# GitHub Marketplace Research Notes

## Confirmed from GitHub docs

Sources:

- https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps
- https://docs.github.com/en/apps/github-marketplace/creating-apps-for-github-marketplace/requirements-for-listing-an-app
- https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/drafting-a-listing-for-your-app
- https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/writing-a-listing-description-for-your-app
- https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/submitting-your-listing-for-publication
- https://docs.github.com/en/apps/github-marketplace/using-the-github-marketplace-api-in-your-app/testing-your-app

## Marketplace model

- GitHub Marketplace distributes two kinds of tools for developers: `GitHub Actions` and `Apps`.
- Free apps can be listed by anyone.
- Paid apps must be owned by an organization and go through publisher verification.

## Requirements that matter immediately

- Listings must provide value to the GitHub community.
- Listings must include valid support and privacy links.
- Listings must specify a pricing plan, including for free listings.
- Apps must integrate with GitHub beyond authentication.
- Listings must include a logo, feature card, and screenshots that follow GitHub's image guidance.
- Draft listings can only be created for public apps.
- GitHub recommends testing billing and webhook flows before requesting publication review.

## Submission flow

1. Create a public GitHub App or OAuth app.
2. Open the app settings and create a draft Marketplace listing.
3. Fill the listing fields, URLs, pricing, and media.
4. Configure Marketplace webhook handling if applicable.
5. Test the listing and billing flows in draft mode.
6. Click `Request publish`.
7. GitHub onboarding reviews the submission and follows up.

## Strategic read for DemandPulse

GitHub Marketplace is attractive because it puts DemandPulse inside a high-intent developer workflow. The blocker is product fit, not the submission process. The current Claude Code plugin is external to GitHub's app system, so the likely path is a future `DemandPulse GitHub App` that syncs issues, discussions, or feedback signals into the DemandPulse trend engine.
