---
id: IDEM
---

# Request idempotency

Applies to how the facility server handles a mutating request a client sends more than once, so a retry after a dropped connection cannot create duplicate records.

## Borrowed terms

- [`Idempotency-Key`](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/): HTTP request header by which a client names one logical operation, so a server can recognise a retry of it.

## The idempotency key

- A mutating request carrying an `Idempotency-Key` header is handled idempotently.
- A mutating request with no `Idempotency-Key` header is handled normally, and no idempotency record is kept for it.
- The key is treated as an opaque string scoped to the authenticated context; the same key value presented under a different user or facility does not resolve to another context's recorded outcome.
- The client generates the key and reuses it across retries, using a fresh one for a distinct action.

> [!NOTE]
> The key identifies one logical operation, not one HTTP request: every retry of the same user action carries the same key. This is what lets the facility web client durably queue and retry mutating requests; the client side is specified separately.

## At-most-once execution

- The first request for a given key runs the handler, and the operation's writes and the key's recorded outcome commit atomically — the key is recorded as completed only if the operation's writes committed.
- A later request for a key already recorded as completed does not run the handler; it returns the recorded response status and body.
- A request whose handler fails and whose transaction rolls back records no completed key and remains retryable.

> [!NOTE]
> The handler runs inside a database transaction so that its writes and the recorded outcome commit together; [`Sequelize.useCLS()`](https://sequelize.org/docs/v6/other-topics/transactions/) over [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) binds the current transaction to the async context, so the handler's existing database calls enrol in it without the handler being changed. Staying retryable is what lets a transient failure be retried while a genuine error, such as a validation failure, recurs identically rather than being memoised.

## Concurrency and crash safety

- A second request for a key whose first request is still executing does not run the handler a second time; it waits for the first to resolve and then returns the first's recorded outcome, or proceeds itself if the first failed without recording a completed outcome.
- A request that never reaches commit — a dropped connection, or the server restarting mid-request — leaves no completed key, and the operation stays retryable.
- An in-progress claim that is never resolved does not block its key permanently: after a bounded lease interval the key can be claimed again.
- The claim is per-key and per-request; no patient or record is ever left locked by idempotency handling.

> [!NOTE]
> Duplicate and abandoned requests are resolved through the key rather than by locking any patient or record, and the lease is what stops a mid-request crash wedging an operation forever.

## The key store

- Idempotency keys and their recorded outcomes are stored on the facility server only and are never synced to central or other facilities.
- A recorded key is retained long enough to cover the client's retry window and is then cleaned up; keys are not expected to be reused after their retention window.

> [!NOTE]
> Recorded keys and their outcomes are operational state that is meaningless on any other server, so the store follows the `DO_NOT_SYNC` pattern used by `RefreshToken` and `LocalSystemFact`.

## Scope

- Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) across the facility API's clinical and reference-data endpoints are eligible for idempotent handling when they carry a key.
- A mutating endpoint added to the facility API is handled idempotently without needing to be listed anywhere.
- Authentication and token-issuing requests — login, token refresh, facility selection, password reset, password change, first-run setup, and role impersonation — are handled normally and their responses are never replayed from a recorded key.
- Streaming and sync endpoints are handled normally and are never wrapped for idempotency.
- Endpoints whose primary effect is an outbound call that a database transaction cannot roll back or de-duplicate — the AI summary endpoints — are handled normally.
- An endpoint is only exempt if it is recorded as an exception together with the reason it cannot be covered, and an exemption that no longer corresponds to a real endpoint is not carried indefinitely.

> [!NOTE]
> Idempotent handling is safe across this surface because the facility server routes its side effects through database-backed queues and database-stored blobs, and performs external integrations downstream through sync and FHIR rather than inline in the request. Coverage is the default rather than something each endpoint opts into, so the exceptions above are the only way an endpoint goes uncovered.
