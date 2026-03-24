# GitHub Marketplace Submission Runbook

## Phase 1: Make the product eligible

1. Decide the vehicle:
   - GitHub App is the recommended path.
   - OAuth app is acceptable but usually weaker for modern GitHub integrations.
   - GitHub Action only makes sense if DemandPulse ships a workflow action.
2. Register the app as `public`.
3. Implement a GitHub-native workflow beyond login.
4. Prepare support, privacy, and documentation URLs.

## Phase 2: Create the draft listing

1. Open the app settings in GitHub.
2. Choose `Edit Marketplace listing`.
3. Create the draft listing.
4. Add pricing:
   - Start with a free plan for the first submission.

## Phase 3: Fill the listing

1. Add the listing name, categories, and descriptions from `listing-content.md`.
2. Upload logo, feature card, and screenshots from `asset-spec.md`.
3. Add the required URLs.
4. Configure the setup URL if listing a GitHub App.

## Phase 4: Validate before review

1. Test the app install flow.
2. Test the Marketplace draft flow.
3. If billing is involved later, test plan and webhook events in draft mode.

## Phase 5: Submit

1. Open the listing overview page.
2. Click `Request publish`.
3. Respond to GitHub onboarding feedback.

## Recommended first release strategy

Publish only after DemandPulse has a true GitHub integration. Until then, this package should be treated as GTM preparation rather than an immediate Marketplace submission.
