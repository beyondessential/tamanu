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
