# Runbook: facility restored from backup (sync fkey conflicts)

After a facility server is restored from backup, sync starts throwing
foreign-key conflict errors that do not otherwise make sense — the server appears
not to receive rows it is requesting.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating — the fix here is a
**[dev-OTS]** action (truncating `sync_lookup`), so read this carefully.

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

Do **not** attempt to hand-edit `updated_at_sync_tick` or the device's tick to
"line them up" — sync ticks are enforced by a database trigger and must never be
set manually.

## 4. Escalate

Because the only known fix is developer-run, treat this as an escalation by
default: hand to a developer with the confirmation of the restore, the fkey-error
evidence (redacted), and the affected facility/device. Use the structured payload
from `senaite-integration-delay.md` §6.
