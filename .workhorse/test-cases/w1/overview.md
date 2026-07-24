# Request idempotency — test cases

Scenarios verifying the server-side idempotency layer (spec: IDEM). The facility
server mounts the middleware; central ships the table but not the middleware.
Most are integration tests against the facility API (supertest); a few are
DB/operational checks.

## Core behaviour

- [ ] A mutating request carrying an `Idempotency-Key` succeeds and creates its record exactly once (verifies spec: IDEM)
- [ ] Re-sending the same request with the same key returns the first response and does not create a second record — simulating a client retry after a lost response (verifies spec: IDEM)
- [ ] The replayed response has the same status and body as the original (verifies spec: IDEM)
- [ ] A mutating request with no `Idempotency-Key` header runs normally and no idempotency record is kept (verifies spec: IDEM)
- [ ] A GET carrying an `Idempotency-Key` is not intercepted (verifies spec: IDEM)

## Failure and retry

- [ ] A request whose handler returns a 4xx (e.g. validation failure) records no completed key; re-sending with the same key re-runs the handler and returns the same 4xx (verifies spec: IDEM)
- [ ] A request whose handler throws records nothing and leaves the operation retryable (verifies spec: IDEM)
- [ ] A key is recorded as completed only when the operation's writes commit — if the commit fails the client receives an error, not a false success (verifies spec: IDEM)

## Concurrency

- [ ] Two concurrent requests with the same key execute the handler only once; the second waits and returns the first's outcome (verifies spec: IDEM)
- [ ] When the first of two concurrent same-key requests fails, the second proceeds and runs the handler itself (verifies spec: IDEM)

## Request binding and scope

- [ ] Presenting an existing key with a different request (different method/path/body → different hash) returns a 409 rather than replaying the unrelated response (verifies spec: IDEM)
- [ ] The same key value under a different user does not resolve to the first user's recorded outcome (verifies spec: IDEM)
- [ ] The same key value under a different facility does not resolve to another facility's recorded outcome (verifies spec: IDEM)

## Scope exclusions

- [ ] Token-issuing endpoints (`/refresh`, `/setFacility`) are not replayed from a key (verifies spec: IDEM)
- [ ] Sync/streaming endpoints (`/sync`, `/syncHealth`, `/patientFacility`) are never wrapped (verifies spec: IDEM)
- [ ] AI summary endpoints (`/ai/*`) are excluded (verifies spec: IDEM)
- [ ] `PUT /invoices/:id/finalise` and `PUT /invoices/:id/insurancePlans` are excluded (unmanaged transactions)

## Store and lifecycle

- [ ] `idempotency_keys` rows are not synced to central or other facilities (verifies spec: IDEM)
- [ ] Writes to `idempotency_keys` do not appear in `logs.changes`
- [ ] The cleanup task removes rows past `expires_at` and leaves unexpired rows
- [ ] The `idempotency_keys` table exists on a central server but stays empty (no middleware mounted there)

## Handler-transaction integrity (needs a running stack)

- [ ] A create handler's row and its idempotency record commit together — killing the connection mid-request leaves neither (verifies spec: IDEM)
- [ ] A handler that opens its own managed `req.db.transaction` still commits atomically with the idempotency record (nested savepoint)
- [ ] CLS propagation: a handler's writes made after the middleware's transaction opened are rolled back when the response is a 4xx (verifies spec: IDEM)
