# Design: requirement vs contribution

## One concept, two words

- **Requirement** (backend / data): One unit of demand — a single row in the `Requirement` table. It has content (original + summarized), context, consent, optional `userId`, status, and clustering. The API and database only know “requirements.”

- **Contribution** (legacy / internal): The same thing — one requirement submitted = one “contribution.” The UI is unified on the word **requirement** (e.g. “You have X requirements”, “Your requirements”, “Requirements submitted”) so users are not confused. The API still may use `contributionCount` internally; that number is the count of requirements linked to the user.

So there is no separate “Contribution” entity or table. One requirement = one contribution. The UI consistently says “requirement.”

## How the backend manages “your” requirements

- **Storage**: Every submission is stored as a `Requirement` with optional `userId`. If the plugin sends `demandpulseAccount` and we resolve it to a user (by email/name), we set `userId`; otherwise the requirement is anonymous (`userId` null).

- **“My requirements”**: We query `Requirement` where `userId = currentUser.id`. The count shown is “You have X requirements.”

- **Trends**: We aggregate and cluster all requirements (with or without `userId`) for the public trends view; per-user linkage is only for the “my requirements” view and for optional features like milestones.

## Requirement status: what “Pending” means

A requirement’s **status** is one of: `PENDING`, `PROCESSING`, `PROCESSED`, `CLUSTERED`, `REJECTED`, `DELETED`. When you submit a requirement (via the plugin or web form), it is stored with status **PENDING** (awaiting processing) — it has been saved but not yet run through the pipeline (e.g. embedding, clustering for trends). Processed requirements move to `PROCESSED` or `CLUSTERED`. In the UI we show “Pending” with a tooltip/hint “Awaiting processing” so it’s clear that nothing is wrong — the requirement is just waiting to be processed. Plugin submissions now trigger the same pipeline as the web form when `ENABLE_AI_PROCESSING` is true: after storage, the API runs embedding, sets status to PROCESSED, and optionally assigns to a cluster (CLUSTERED). If the AI step fails (e.g. missing API key), the requirement stays Pending.
