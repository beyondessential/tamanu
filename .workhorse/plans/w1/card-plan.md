# W1 spawned cards

W1 has been reshaped into a backend-led server-side request idempotency layer. The
original client-side durable queuing and retry work becomes a follow-up card that
depends on it — once the server can safely absorb replays, the client work shrinks
to generating a stable key per action and retrying durably.

## Durable client-side request queuing and retry (facility web)

Build the facility web client's durable queue and retry on top of the server-side
idempotency layer from W1. The client generates a stable idempotency key per user
action and persists it (so a retry after reload/crash reuses the same key),
durably queues mutating requests that fail on unambiguous connection errors,
retries them with backoff until they succeed or are abandoned, and surfaces a
backlog signal when too much work is pending or the oldest pending item is too old.
Reads stay in-memory as today; auth/token-issuing, streaming/sync, and AI
endpoints are never queued. Multipart/binary uploads may be deferred from this
first version. Depends on W1's `Idempotency-Key` contract and skip-list.
