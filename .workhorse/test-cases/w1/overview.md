# Request idempotency — test cases

Scenarios verifying the server-side idempotency layer (spec: IDEM). The facility
server mounts the middleware; central ships the table but not the middleware.
Most are integration tests against the facility API (supertest); a few are
DB/operational checks.

Automated coverage lives in:

- `packages/facility-server/__tests__/apiv1/idempotency.test.js` — behaviour through the real API
- `packages/facility-server/__tests__/apiv1/idempotencyTransaction.test.js` — transaction integrity, using a purpose-built app so handlers can fail on demand
- `packages/facility-server/__tests__/apiv1/idempotencyPolicy.test.js` — the policy guard over the route surface
- `packages/facility-server/__tests__/tasks/CleanupIdempotencyKeys.test.js` — retention

## Core behaviour

- [x] A mutating request carrying an `Idempotency-Key` succeeds and creates its record exactly once (verifies spec: IDEM)
- [x] Re-sending the same request with the same key returns the first response and does not create a second record — simulating a client retry after a lost response (verifies spec: IDEM)
- [x] The replayed response has the same status and body as the original (verifies spec: IDEM)
- [x] A mutating request with no `Idempotency-Key` header runs normally and no idempotency record is kept (verifies spec: IDEM)
- [x] A GET carrying an `Idempotency-Key` is not intercepted (verifies spec: IDEM)

## Failure and retry

- [x] A request whose handler returns a 4xx (e.g. validation failure) records no completed key; re-sending with the same key re-runs the handler and returns the same 4xx (verifies spec: IDEM)
- [x] A request whose handler throws records nothing and leaves the operation retryable (verifies spec: IDEM)
- [ ] A key is recorded as completed only when the operation's writes commit — if the commit fails the client receives an error, not a false success (verifies spec: IDEM)

## Concurrency

- [x] Two concurrent requests with the same key execute the handler only once; the second waits and returns the first's outcome (verifies spec: IDEM)
- [ ] When the first of two concurrent same-key requests fails, the second proceeds and runs the handler itself (verifies spec: IDEM)

## Request binding and scope

- [x] Presenting an existing key with a different request (different method/path/body → different hash) returns a 409 rather than replaying the unrelated response (verifies spec: IDEM)
- [x] The same key value under a different user does not resolve to the first user's recorded outcome (verifies spec: IDEM)
- [x] The same key value under a different facility does not resolve to another facility's recorded outcome (verifies spec: IDEM)

## Scope exclusions

- [x] Token-issuing endpoints (`/refresh`, `/setFacility`) are not replayed from a key (verifies spec: IDEM)
- [x] Sync/streaming endpoints (`/sync`, `/syncHealth`, `/patientFacility`) are never wrapped (verifies spec: IDEM)
- [ ] AI summary endpoints (`/ai/*`) are excluded (verifies spec: IDEM)
- [ ] `PUT /invoices/:id/finalise` and `PUT /invoices/:id/insurancePlans` are excluded (unmanaged transactions)

## Store and lifecycle

- [x] `idempotency_keys` rows are not synced to central or other facilities (verifies spec: IDEM)
- [x] Writes to `idempotency_keys` do not appear in `logs.changes`
- [x] The cleanup task removes rows past `expires_at` and leaves unexpired rows
- [ ] The `idempotency_keys` table exists on a central server but stays empty (no middleware mounted there)

## Handler-transaction integrity (needs a running stack)

- [ ] A create handler's row and its idempotency record commit together — killing the connection mid-request leaves neither (verifies spec: IDEM)
- [x] A handler that opens its own managed `req.db.transaction` still commits atomically with the idempotency record (nested savepoint)
- [x] CLS propagation: a handler's writes made after the middleware's transaction opened are rolled back when the response is a 4xx (verifies spec: IDEM)
- [x] An endpoint that never declares a permission check neither commits its writes nor records an outcome, and its retry is not answered with a replayed success
- [x] An endpoint that does declare a permission check still records and replays normally

## Policy guard

Coverage is opt-out, so these protect the boundary rather than individual endpoints.

- [x] The idempotency middleware is mounted on the facility API
- [x] Every mutating endpoint registered above the middleware is listed, with a reason, in the policy module
- [x] The pre-middleware list carries no entries for endpoints that no longer exist
- [x] Every exclusion carries a reason and still matches its own sample path
- [x] No exclusion is broad enough to swallow the clinical data-entry surface
- [x] Nothing is mounted outside apiv1 that could take mutating traffic
- [x] No route file uses an unmanaged transaction except the ones excluded for exactly that reason
