# Eligibility Gap: Current Plugin vs GitHub Marketplace

## Current state

The existing package at `claude-plugin-demandpulse/` is a Claude Code plugin. It is not:

- a GitHub App,
- an OAuth app, or
- a GitHub Action.

## Why that matters

GitHub Marketplace for apps is designed around GitHub Apps and OAuth apps, and GitHub states that marketplace apps must provide value to the GitHub community and integrate with the platform beyond authentication.

The current plugin submits requirement signals to DemandPulse, but it does not install into GitHub or act on GitHub resources.

## Minimum product needed before real submission

- Register a public GitHub App owned by the appropriate GitHub account or organization.
- Define a GitHub-native workflow, for example:
  - create GitHub issues from validated requirement clusters,
  - sync GitHub Discussions or issue labels into DemandPulse,
  - annotate repositories with trend insights,
  - summarize repeated issue themes across repos.
- Add the required setup URL, support URL, and privacy policy URL.
- If using paid plans later, move ownership to an organization and complete publisher verification.

## Recommended stance

Treat this package as a `pre-submission listing kit`, not a publishable GitHub Marketplace release for the current plugin artifact.
