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

## Idempotency key table

Model `IdempotencyKey`, table `idempotency_keys`. `SYNC_DIRECTIONS.DO_NOT_SYNC`
(like `RefreshToken` / `OneTimeLogin`): UUID `id` PK, standard
`created_at`/`updated_at`, **no `updated_at_sync_tick`**, no mobile (TypeORM)
counterpart. Records are operational state local to each server.

**Ships on both servers now.** The model lives in `@tamanu/database` and the
single shared server migration creates `idempotency_keys` on **both central and
facility** DBs (server migrations run against both). In this card only the
**facility** app mounts the middleware, so the **central table sits empty** until
the central follow-up wires it up — this avoids a second migration later. The
middleware itself is **shared machinery** (a cross-server middleware in
`@tamanu/shared`, mounted per-app after auth), so mounting on central is a
few lines once its classification pass is done.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` default |
| `key` | TEXT not null | the client's `Idempotency-Key` header value |
| `user_id` | FK `users` not null | scope — `belongsTo(User)` |
| `facility_id` | FK `facilities` not null | scope — a facility server may host several |
| `method` | TEXT not null | HTTP method |
| `path` | TEXT not null | request path, binds the key to its endpoint |
| `request_hash` | TEXT not null | fingerprint of method + path + normalised body; detects the same key reused for a *different* request |
| `status` | TEXT not null | `in_progress` \| `completed` |
| `response_status` | INTEGER null | HTTP status, set on completion |
| `response_body` | JSONB null | recorded JSON response, set on completion (PII → dbt masking) |
| `claimed_at` | TIMESTAMP not null | when the in-progress claim was taken; drives the lease |
| `completed_at` | TIMESTAMP null | when completed |
| `expires_at` | TIMESTAMP not null | retention horizon for cleanup |

**Uniqueness / lookup:** unique index on (`key`, `user_id`, `facility_id`). This
is both the dedup key and the row-lock point for Design A concurrency. Scoping by
user + facility satisfies IDEM's "a key under a different user/facility does not
resolve to another context's outcome".

**Supporting indexes:** `expires_at` (cleanup scans); (`status`, `claimed_at`)
(lease-reclamation scans, only exercised under Design B).

**Behaviour notes:**
- `status` + `claimed_at` are carried even though Design A (single wrapping txn)
  never exposes a visible `in_progress` row — so the table already supports
  Design B and the lease without a later migration.
- A request presenting an existing `key` whose `request_hash` differs from the
  stored one is a client bug (same key, different operation): respond with a
  client error rather than replaying the unrelated response.
- Only `application/json` responses are memoised in v1 (`response_status` +
  `response_body`, replayed with `content-type: application/json`). Other response
  headers are not recorded — consistent with excluding binary/download endpoints.
- Schema change ⇒ regenerate dbt source models (`database/model/`) with a
  `config.meta.masking` entry for `response_body` (may contain PII).

## Classification pass — mutating endpoints

Headline result: the "idempotency isn't systematic" problem is real at the
*handler* level, but Tamanu funnels nearly all side effects through **DB-backed
queues and DB-stored blobs**, so a transaction-wrapping idempotency middleware
makes essentially the **entire clinical mutation surface replay-safe**. Only AI is
a genuine external-effect exclusion. This replaces the earlier "curated allow-list
of a subset" with "wrap almost everything; exclude a short, well-understood list".

Why the earlier "side-effect" greps were mostly false alarms:
- **Comms are DB-queued** — handlers do `PatientCommunication.create(...)`; a
  background worker sends later. The row is a DB write; idempotency memoisation
  prevents the duplicate row that would cause a duplicate send. (e.g.
  `appointments` email reminder, portal invites.)
- **Reports are DB-queued** — `reportRequest` writes a `ReportRequest` row; a
  worker generates + emails downstream.
- **Attachments are DB blobs** — `Attachment.data` is a `bytea` column that syncs
  (`attachment.js` reads `.data/.type/.size` from the model). Uploads are DB
  writes, not filesystem/S3.
- **Imaging/lab/mSupply integrations run downstream** via FHIR/sync, not inline in
  the facility mutation. `imaging` POST/PUT are pure DB writes; the external
  provider is only touched in the GET (`renderResults`).
- **Telegram** API surface is a read-only `/bot-info` GET; bot messaging is a
  websocket service.

### Category A — DB-only, replay-safe under the transaction wrap (the default)
Effectively all clinical data entry: allergy, diagnosis, ongoingCondition,
familyHistory, vitals, triage, procedure, referral, encounter (+ notes/diets/
document sub-writes), medication (all endpoints), labs/labRequest/labTest/
labTestPanel, surveyResponse + surveyResponseAnswer, invoice + patientPayment,
appointments (incl. email reminder → `PatientCommunication`), notes, tasks,
notifications, patient + patientContact/patientSecondaryId/patientDeath/
patientIssue/patientCarePlan/patientRelations, patientProgramRegistration
(+conditions) + programRegistry, patientVaccine, locationAssignments, location/
locationGroup/department, reference data (referenceData, program, survey,
scheduledVaccine, template, certificateNotification, asset,
patientFieldDefinition), reportRequest (→ `ReportRequest`), imaging POST/PUT.

### Category B — exclude from the middleware (external effect a txn can't cover)
- **AI summary endpoints** (`/ai/patient/*`, `/ai/encounter/*`) — outbound LLM
  call, non-transactional, expensive; not data entry.

### Category C — out of scope / never queued (auth, critical, streaming)
- Auth / token-issuing / pre-auth: login, refresh, setFacility, resetPassword,
  changePassword, public/setup, admin/impersonate, admin/settings/cache — must not
  be memoised/replayed; the client treats them as synchronous/critical.
- Streaming / sync: `/sync`, `/syncHealth`, `/patientFacility`.

### Practical caveat (safe, but handle with care in v1)
- **Multipart/binary uploads** (document/attachment/profile) are DB-safe, but the
  middleware buffering a binary response and keying a multipart request is fiddly.
  Candidate to defer from the *client queue* v1 (large, rare, unlikely to be
  repeatedly retried on flaky links) even though the *server* layer covers them.

## Central server applicability

The mechanism ports 1:1 — central has the same choke point (`createApi.js`:
`authModule` → `attachAuditUserToDbSession` → `constructPermission` →
`buildRoutes`, with `req.db = store.sequelize` on the same `@tamanu/database`, same
CLS). So building the model, migration, and middleware as **shared infrastructure**
lets central mount it in a few lines. But the value and risk differ:

- **Sync is the dominant central write path and is out of scope** — it is
  streaming and already replay-safe by design (sessions, ticks, resumable
  cursors). Idempotency wouldn't touch it.
- **The surface that benefits is non-sync, human/admin/patient-driven:**
  `/admin/*` (users, roles, settings, provisioning, reference data, patient
  merge), `/facility/*` (registration), and the **patient portal** (`/api/portal`)
  — patient self-service over the public internet is arguably the strongest
  central case, given mobile connectivity.
- **Integrations (`/integration`, FHIR)** have their own conditional-create /
  `If-None-Exist` idempotency — align with it, don't double up.
- **Stakes are inverted vs facility:** a duplicate on central is *higher
  consequence* (central is source of truth; it fans out to every facility via
  sync) but *lower likelihood* (fewer direct mutating calls, better-behaved
  clients).
- **Do not assume facility's "DB-only ⇒ safe" parity holds.** Central runs more
  external side effects inline — `req.emailService` is injected on central, plus
  outbound integrations — so a central classification pass is required before
  mounting. Provisioning / bulk import especially is a poor fit for Design A's
  single wrapping transaction (long-running, commits in stages) and should be
  excluded or left to its own idempotency.

**Recommendation:** build shared, mount on **facility in this card** (the
motivating case). The `idempotency_keys` table ships on central now too (empty),
so mounting the middleware on central is a follow-up gated on a central-surface
classification pass rather than assumed — no further migration needed.

## Locking scope and crash safety

The idempotency-key lock is **operation-scoped** (one `Idempotency-Key`) and lives
only for the request's transaction. It prevents a concurrent retry of the *same*
request from double-executing; it is not entity-scoped and is invisible to the UI.

No "patient stuck" risk: a client crash mid-request either completes (key →
completed, replay-safe) or drops the connection and Postgres rolls back and
auto-releases. **The one real stuck case is a server crash after a key is marked
in-progress but before it completes — the key would then block its own retry.
Mitigation (load-bearing, must be specced): an in-progress lease/timeout — an
in-progress key older than a bounded interval is treated as abandoned and becomes
retryable.**

Entity-level "this patient is being edited" locking was considered and is
**explicitly out of scope** — it's a different feature (entity-scoped, session-
lifetime), Tamanu's distributed/sync model makes a global hard lock infeasible,
and the idempotency layer does not provide it.

## Spec

Server-side behaviour is specified in `specs/platform/request-idempotency.md`
(id `IDEM`). The client durable-queue follow-up is captured in `card-plan.md`.

## Open questions
- **Resolved:** key is carried in an `Idempotency-Key` header (not derived from a
  body id) — see IDEM.
- **Resolved:** the key store is facility-local and non-synced — see IDEM.
- Transaction topology is deliberately left to implementation: a single wrapping
  transaction is lease-free for crash safety but holds a connection for the whole
  request; a committed in-progress marker shortens locks but needs the lease. IDEM
  specifies the guarantees both must satisfy; the lock optimisation is deferred.
- Backlog threshold signal (count vs age of oldest pending) — belongs to the
  client follow-up card, not this one.
- Where the client generates and persists keys so a retry after reload reuses the
  same key — client follow-up card.

## Implementation checklist (this card — facility)

- [x] `IdempotencyKey` model (`@tamanu/database`), `DO_NOT_SYNC`, columns per the
  table section above; `belongsTo(User)` + `belongsTo(Facility)`.
- [x] Export it from `models/index.ts`.
- [x] Migration creating `idempotency_keys` on both servers (unique
  `(key, user_id, facility_id)`; `expires_at` and `(status, claimed_at)` indexes).
  `1784700000000-createIdempotencyKeysTable.ts`.
- [x] Add `public.idempotency_keys` to `NON_SYNCING_TABLES` and `NON_LOGGED_TABLES`
  (response bodies may hold PII).
- [x] Shared middleware factory `@tamanu/database/utils/requestIdempotency` —
  Design A: single wrapping transaction, claim via unique index, buffer + defer
  response flush, commit on 2xx / roll back otherwise, replay completed keys,
  `request_hash` mismatch → 409. Takes an `excludePaths` matcher.
- [x] Mount on facility `createApiv1` after `attachAuditUserToDbSession`, skipping
  `/refresh`, `/setFacility`, `/admin/*`, `/sync`, `/syncHealth`, `/patientFacility`,
  `/ai` (+ the two invoice endpoints below).
- [x] Retention cleanup `CleanupIdempotencyKeys` `ScheduledTask` + config default.
- [ ] Regenerate dbt source models (`database/model/`) with `response_body` masking
  — deferred to handoff (needs a live DB + `npm run dbt-generate-model`).
- [x] **Design A audit** (see result below).

### Design A audit result

Facility mutating handlers were scanned for the commit-then-continue pattern (an
independent commit mid-request, which the wrapping transaction would change).
Only two hits, both invoice endpoints using **unmanaged** transactions with an
explicit `transaction.commit()` (and both violating the project's managed-
transaction rule):

- `PUT /invoices/:id/finalise` (`invoice/invoices.js`)
- `PUT /invoices/:id/insurancePlans` (`invoice/insurancePlans.js`)

Whether these stay atomic under Design A depends on whether Sequelize nests an
unmanaged `sequelize.transaction()` as a savepoint under the CLS parent — **not
verified** (needs a runtime check; do not guess). Both are **excluded from
idempotency** via the skip-list for now — safe either way. Follow-up: migrate them
to managed transactions (`req.db.transaction(async () => …)`, no `{ transaction }`
args) per `llm/project-rules/sequelize-transactions.md`, then drop the exclusions.

### Needs runtime verification (can't run here)

- **CLS propagation across `next()`** — that the handler's writes enrol in the
  middleware's wrapping transaction (the load-bearing premise; same mechanism as
  `attachAuditUserToDbSession`, but confirm end-to-end).
- **Error-path rollback** — a handler throw routes to the app error handler, whose
  `res.status().send()` is captured by the response override, driving rollback +
  flush of the error response.
- **Response buffering** under Express 5 for `res.json`/`res.send`/`res.end`.
- The unmanaged-transaction nesting question above.
