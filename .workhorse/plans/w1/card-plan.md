# W1 spawned cards

W1 is a backend-led server-side request idempotency layer, built as shared
machinery: the `idempotency_keys` table and model ship on both central and
facility, but W1 only mounts the middleware on the facility server. Two follow-ups
depend on it — the facility web client's durable queue (the original motivating
work), and mounting the same middleware on central once its surface is classified.

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

## Mount request idempotency on the central server

Mount W1's shared idempotency middleware on the central server, activating the
`idempotency_keys` table that W1 already ships there (empty). Central's stakes are
inverted from facility — a duplicate is higher-consequence (source of truth, fans
out to every facility via sync) but lower-likelihood — and its surface differs, so
the core of this card is a central-surface classification pass. Sync stays out of
scope (streaming, already replay-safe); FHIR/integrations have their own
conditional-create idempotency; and unlike facility, central runs external side
effects inline (email via `emailService`, outbound integrations) and has
long-running provisioning/bulk-import handlers that don't fit a single wrapping
transaction — all of which need excluding or individual assessment. The strongest
target is the patient portal (`/api/portal`), where patients self-serve over flaky
public-internet connections. Depends on W1.
