# Linear Research Notes

## Confirmed from Linear docs

Source: https://linear.app/docs/integration-directory

- Linear's distribution surface is the `Integration Directory`.
- Third-party integrations can be listed there alongside Linear-crafted integrations.
- Linear recommends building applications with OAuth.
- Linear recommends having a separate workspace for the application so all admins can access it.
- Linear states it accepts integrations it thinks are useful to the community and "built by formal companies."
- Submission is a manual workflow:
  - Fill out a Google Form.
  - Submit assets to `integrations@linear.app` or include an asset link in the form.
  - Send questions to `integrations@linear.app`.

## What the public docs do not fully expose

The public docs link to the form and a Figma template, but they do not list every field inline on the documentation page.

## Inferred from public integration pages

Sources:

- https://linear.app/integrations/zapier
- https://linear.app/integrations/rootly
- https://linear.app/integrations/dixa
- https://linear.app/integrations/truto

Based on published listings, the directory page structure consistently includes:

- Product name
- Publisher line (`By ...`)
- Overview
- How it works
- Configure
- Website
- Category
- Contact
- Optional docs or website link
- Multiple screenshots
- Brand icon/logo

These fields are treated as inferred requirements in this package, not officially confirmed form fields.

## Go / no-go assessment for DemandPulse

Go, with one dependency: DemandPulse needs a real Linear integration entry point before submission.

Why:

- Linear is explicitly open to third-party integrations.
- DemandPulse fits the audience if positioned as product intelligence for issue triage, bug signals, and customer-request analysis.
- The current Claude Code plugin alone is not enough for directory approval because the listing needs to describe a Linear-facing workflow, not only an external plugin.

## Recommended listing angle

Position DemandPulse as:

"Turn AI-captured developer requirements into triage-ready Linear issues and trend signals."

That angle matches the directory patterns for product, engineering, bug-reporting, and customer-feedback tools.
