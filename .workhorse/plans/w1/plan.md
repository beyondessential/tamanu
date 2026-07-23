# Durable client-side request queuing and retry — working notes

## Status: reshaped — backend-led

W1 is reshaped into a **backend-led server-side request idempotency** card. The
client durable queue + retry becomes a **follow-up card that depends on this one**
(it shrinks to "generate a stable key per action, persist it, retry durably", with
a small exclusion list for side-effecting endpoints). See "Why we pivoted" below.

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

## Locking: scope and lifetime (do not conflate)

Two unrelated locks share the word "lock":

- **Lock A — idempotency-key lock (this card).** Scope: one operation (one
  `Idempotency-Key`). Lifetime: one request/transaction. Prevents a concurrent
  retry of the *same* request from double-executing. Not entity-scoped, invisible
  to the UI.
- **Lock B — "patient is being edited" (separate future card, not this one).**
  Scope: an entity. Lifetime: an editing session across many requests. Pessimistic
  concurrency / presence. **Lock A does not provide Lock B.**

**Stuck-lock analysis (Lock A):** no "patient stuck" risk. Transaction-scoped; a
client crash mid-request either completes (key → completed, replay-safe) or drops
the connection and Postgres rolls back and auto-releases. The one real stuck case
is a **server** crash after marking a key in-progress but before completing — the
key then blocks its own retry. **Mitigation (must be specced): a lease/timeout —
an in-progress key older than N seconds is treated as abandoned and retryable.**

**On Lock B (advisory only, if pursued later):** Tamanu is distributed/sync-based,
so a *global* hard lock is architecturally impossible — only a local, single-
facility, best-effort advisory is feasible. Prefer **presence** (via the existing
`defineWebsocketService`, auto-expiring on disconnect) and/or **optimistic
conflict detection at save time** over a pessimistic lock, since stuck-locks are
the central hazard of hard entity locks. Keep this off W1.

## Open questions
- Header-based `Idempotency-Key` vs deriving a key from a client-generated
  operation id already in the body.
- Backlog threshold signal (count vs age of oldest pending) — deferred until the
  client side is back in scope.
- Where the client generates and persists keys so a retry after reload reuses the
  same key.
