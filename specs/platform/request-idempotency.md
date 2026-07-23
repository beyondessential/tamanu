---
id: IDEM
---

# Request idempotency

The facility server executes a mutating request at most once even when a client sends it more than once, so a client that retries a request after a dropped connection cannot create duplicate records. A request opts in by carrying an idempotency key; the server records the outcome of the first successful execution against that key and returns that same outcome to any later request carrying the same key. This is what lets the facility web client durably queue and retry mutating requests safely (the client side is specified separately).

## The idempotency key

A request opts into idempotent handling by sending an `Idempotency-Key` header. The key identifies one logical operation: every retry of the same user action carries the same key, and a distinct action carries a fresh one. The client is responsible for generating the key and reusing it across retries; the server treats it as an opaque string.

- [ ] A mutating request carrying an `Idempotency-Key` header is handled idempotently as described below.
- [ ] A mutating request with no `Idempotency-Key` header is handled normally, and no idempotency record is kept for it.
- [ ] The key is treated as an opaque string scoped to the authenticated context; the same key value presented under a different user or facility does not resolve to another context's recorded outcome.

## At-most-once execution

The handler runs inside a database transaction so that the handler's writes and the recorded outcome for the key commit together. The project binds the current transaction to the async context (`Sequelize.useCLS()` over `AsyncLocalStorage`), so the handler's existing database calls enrol in this transaction without the handler being changed.

- [ ] The first request for a given key runs the handler, and the operation's writes and the key's recorded outcome commit atomically — the key is recorded as completed only if the operation's writes committed.
- [ ] A later request for a key already recorded as completed does not run the handler; it returns the recorded response status and body.
- [ ] A request whose handler fails and whose transaction rolls back records no completed key and remains retryable, so a transient failure can be retried and a genuine error (for example a validation failure) recurs identically on retry rather than being memoised.

## Concurrency and crash safety

Duplicate and abandoned requests are resolved through the key rather than by locking any patient or record. The claim on a key lasts only as long as the request that holds it.

- [ ] A second request for a key whose first request is still executing does not run the handler a second time; it waits for the first to resolve and then returns the first's recorded outcome, or proceeds itself if the first failed without recording a completed outcome.
- [ ] A request that never reaches commit — a dropped connection, or the server restarting mid-request — leaves no completed key, and the operation stays retryable.
- [ ] An in-progress claim that is never resolved does not block its key permanently: after a bounded lease interval the key can be claimed again, so a mid-request crash cannot wedge an operation forever.
- [ ] The claim is per-key and per-request; no patient or record is ever left locked by idempotency handling.

## The key store

Recorded keys and their outcomes are operational state that is meaningless on any other server, so the store stays local to the facility server and does not sync (the `DO_NOT_SYNC` pattern used by `RefreshToken` and `LocalSystemFact`).

- [ ] Idempotency keys and their recorded outcomes are stored on the facility server only and are never synced to central or other facilities.
- [ ] A recorded key is retained long enough to cover the client's retry window and is then cleaned up; keys are not expected to be reused after their retention window.

## Scope

Idempotent handling covers the mutating clinical data-entry surface, which is safe to replay because the facility server routes its side effects through database-backed queues and database-stored blobs (patient communications, report requests, attachments) and performs external integrations downstream through sync and FHIR rather than inline in the request. A few endpoints are handled normally, without idempotency handling, because replaying them is either meaningless or unsafe.

- [ ] Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) across the facility API's clinical and reference-data endpoints are eligible for idempotent handling when they carry a key.
- [ ] Authentication and token-issuing requests — login, token refresh, facility selection, password reset, password change, first-run setup, and role impersonation — are handled normally and their responses are never replayed from a recorded key.
- [ ] Streaming and sync endpoints are handled normally and are never wrapped for idempotency.
- [ ] Endpoints whose primary effect is an outbound call that a database transaction cannot roll back or de-duplicate — the AI summary endpoints — are handled normally and excluded from idempotent handling.
