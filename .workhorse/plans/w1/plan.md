# Durable client-side request queuing and retry — working notes

## Status: pivoting

The card as originally written (a purely client-side durable queue + retry over the
facility web API) is **tabled** pending investigation into making the endpoints
themselves safe to replay. See "Why we pivoted" below.

## API surface survey (facility web → facility server)

- **Single client choke point.** Every facility-web call goes through
  `TamanuApi.fetch` (`packages/api-client/src/TamanuApi.ts`), wrapped by
  `packages/web/app/api/TamanuApi.jsx`. There is already an opt-in **in-memory**
  exponential backoff (`fetchWithRetryBackoff`, default 15 attempts) gated on the
  `backoff` option and the `isRecoverable` error taxonomy (`@tamanu/errors`).
  Nothing is durable — a reload/crash loses in-flight and queued work.
- **~152 mutating endpoints across 51 route files.**
- **Idempotency is not systematic.** Only 11 route files (~22 endpoints) use the
  generic `simplePost` (`packages/shared/src/utils/crudHelpers.js`), which takes a
  client-generated `id`. The other ~130 mutations are bespoke handlers with
  compound side effects (e.g. `POST /encounter` also auto-creates an invoice and
  links referrals in one transaction; `medication` has 21 mutation endpoints).
- **Even the "clean" creates aren't replay-safe as-is.** `simplePost` treats a
  duplicate client `id` as an *error* (`"Cannot create object with id (…), it
  already exists"`, a 4xx), so a create that commits but loses its response
  surfaces a failure on retry rather than an idempotent success.

## Why we pivoted

A purely client-side durable queue can't safely retry a heterogeneous,
mostly-non-idempotent surface — blind replay risks duplicate clinical records.
That forced an allow-list ("queueable is opt-in; everything else is critical and
fails synchronously"), meaning the feature would only ever cover a hand-curated
subset. The more valuable move is to **make the endpoints replay-safe centrally**,
which both shrinks the client problem to "send a stable key + retry" and lays
groundwork for the planned offline work next year.

## Feasibility of a non-invasive server-side fix — looks viable

A Stripe-style **idempotency-key middleware**, adapted to Tamanu's CLS:

- Client sends an `Idempotency-Key` header, stable across retries of one logical
  operation (new key per distinct user action).
- Middleware mounted after auth on mutating methods:
  - Wrap the handler in `sequelize.transaction()`. Because the project uses
    `Sequelize.useCLS()` over `AsyncLocalStorage`
    (`packages/database/src/services/database.js`), **the handler's inner writes
    auto-enrol in that transaction with no handler changes.** This is the
    load-bearing mechanism and it holds.
  - Look up the key in a **facility-local, non-synced** `idempotency_keys` table
    (`DO_NOT_SYNC` precedent: `RefreshToken`, `LocalSystemFact`):
    - completed → replay stored status + body, skip the handler (replay-safe);
    - in-progress → 409 / wait (row lock);
    - new → run handler, buffer the response, persist `key → status+body` in the
      same transaction, commit, then send.
  - TTL cleanup of old keys.

### What this makes safe
All **DB-state** mutations — i.e. the duplicate-record hazard — across the ~130
bespoke handlers, without rewriting them.

### Residual risks / must be enumerated (NOT covered by a DB transaction)
- **Non-DB side effects** aren't rolled back or de-duplicated: outbound emails
  (`certificateNotification`), external integrations (imaging/lab/mSupply),
  attachment/file uploads (`postWithFileUpload`), some websocket notifications,
  AI calls. These stay at-least-once; such endpoints either remain
  non-queueable (critical) or need individual assessment.
- **Streaming endpoints** (sync stream) must be excluded.
- **Transaction lifetime / connection-pool pressure.** Wrapping every mutation in
  a middleware transaction lengthens transactions and can increase lock
  contention (cf. coding-rules "limit concurrency"). Needs measurement.
- **Response interception** (deferring `res.send` until after commit) needs care
  in Express 5.
- **Handlers that open their own `req.db.transaction`** become savepoints under
  the outer transaction — fine, but confirm none rely on committing independently
  mid-request.

## Open questions
- Header-based `Idempotency-Key` vs deriving a key from a client-generated
  operation id already in the body.
- Backlog threshold signal (count vs age of oldest pending) — deferred until the
  client side is back in scope.
- Where the client generates and persists keys so a retry after reload reuses the
  same key.
