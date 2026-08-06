# Runbook: facility restored from backup (sync fkey conflicts)

After a facility server is restored from backup, sync starts throwing
foreign-key conflict errors that do not otherwise make sense — the server appears
not to receive rows it is requesting.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating — the fix here is a
**[dev-OTS]** action (truncating `sync_lookup`), so read this carefully.

A restore has a second dimension besides sync: the facility's blob store holds
attachment and asset bytes, and it is restored alongside the database. Section 5
covers what to check there. The two are independent, so work the sync problem
first if that is what was reported.

## 1. When this applies

Use this when, shortly after a facility restore, the facility's sync errors show
foreign-key conflicts or "missing" rows the server should be getting. This is the
signature of the central `sync_lookup` state for that device being **"in the
future"** relative to the restored facility's local sync state: the facility
asks from a tick the lookup has already moved past.

Confirm the restore actually happened (Canopy notes, the deployment's change
record) before acting — do not assume a restore from fkey errors alone.

## 2. Establish context

Which deployment and facility, and confirmation of the restore — see
`../deployment-context.md`. Read the facility sync errors central-side (cookbook
"Last 10 errors" in `../reference/query-cookbook.md`) to confirm the fkey-conflict
signature. **[diagnose]**

## 3. Resolve

The documented fix is to **truncate the `sync_lookup` table** so it rebuilds,
which lets the restored facility catch up. Truncating `sync_lookup` forces a full
re-sync for **every** device on the next session and can cause a long fleet-wide
slowdown — but it is **recoverable** (the cost is sync duration, not data), so it
is **[dev-OTS]**, a **developer decision**, not a ruled-out hard gate
(`../ruled-out-actions.md`). It is never a support first-line action: only a
developer, having confirmed the restore, runs it, with OTS.

- **[dev-OTS / developer-run]** Truncate `sync_lookup` (central), accepting the
  one-off slower sync for all devices next session. The cost is temporary and
  affects sync duration only, not data (cited: on-call cheat sheet, "When a
  facility server has been restored from backup").

`[inferred — dev to confirm]`: the source states the truncate as the fix but not
whether a narrower remediation (e.g. resetting only the affected device's lookup
rows) is preferable to a full truncate — a developer should decide which is
appropriate for the blast radius.

Do **not** attempt to hand-edit `updated_at_sync_tick` or the device's tick to a
**specific value** to "line them up" — sync ticks are enforced by a database
trigger, so a hand-picked value is just overwritten and cannot force sync state
into alignment. (This is distinct from the sanctioned single-record re-queue bump
— setting a *missing FK record*'s tick to `1` and letting the trigger promote it
to the current tick — in `sync-restart-loop.md` §5; that works precisely because
of the same trigger.)

## 4. Escalate

Because the only known fix is developer-run, treat this as an escalation by
default: hand to a developer with the confirmation of the restore, the fkey-error
evidence (redacted), and the affected facility/device. Use the structured payload
from `senaite-integration-delay.md` §6.

## 5. Check the blob store after the restore

A facility restore covers the database and the blob store as a pair, the database
captured first and the store second. Both must have been restored: a database
restored without its store leaves every attachment and asset on that facility
without its bytes.

Most of what could be wrong here self-corrects, so the job is to confirm recovery
is happening rather than to intervene.

Queries for the checks below are in `../reference/query-cookbook.md` under "Blob
store".

- **[diagnose]** Confirm the store was restored at all, and that its root is where
  the facility's configuration expects it. A store restored to the wrong path reads
  as a facility that has lost every attachment. Compare the store size by tier
  against the files actually under the configured root.
- **[diagnose]** Check for files awaiting their bytes. After a restore some
  references are legitimately content-pending, and a facility resolves those by
  fetching from central on demand and in the background. A count that falls over
  the following hours is the system healing itself; one that does not move points
  at the transfer path, not at the restore.
- **[diagnose]** Check the outbox is draining, using the outbox depth and age
  query. The outbox holds blobs originated at this facility that central has not
  yet acknowledged, and it is the only durable copy of that content. After a
  restore the background pusher resumes delivering them.

Two failure modes here are worse than content-pending and do warrant escalation:

- An **outbox blob missing from the restored store** is content that may exist
  nowhere else, since central had not acknowledged it. Escalate rather than
  waiting for it to resolve, because nothing will refetch it.
- A **corrupt blob** reported by the store's own verification, rather than a merely
  absent one. A facility cache copy repairs itself by refetching, so a corruption
  report that persists means the repair path is not working.

Do **not** hand-copy blob files between servers, or delete store files to "reset"
the facility. The store is content-addressed and its registry lives in the
database, so files placed on disk by hand are not visible to the server, and
deleting outbox files destroys the only copy of that content.
