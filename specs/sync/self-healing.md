---
id: HEAL
---

# Sync self-healing for missing references

When a facility server or mobile device syncs a record that references another record it does not hold, the sync fails on a missing foreign key. The referenced record can be absent for many reasons — dropped from the sync lookup, hard-deleted, or a sync defect — but the resolution is always the same: re-queue the missing record from central so the next sync delivers it. This describes an automated path where a client reports the missing references it hit and central re-queues them, with guards against runaway bumping and visibility into how often it happens.

## Detecting a missing reference

- Both facility servers and mobile devices detect missing references while persisting pulled records, and report them to central through the same central endpoint. The detection differs by client: mobile inspects `PRAGMA foreign_key_check` results before commit, and the facility server reads the missing key from the PostgreSQL foreign-key violation.
- From a detected violation the client derives, for each missing reference, the **table** and **id** of the absent parent record — the pair central needs to re-queue it.
- A missing reference still fails the sync session as it does today. Self-healing does not rescue the current session; it re-queues the records so a later sync succeeds.
- On hitting missing references, the client posts the collected `(table, id)` pairs to central's phone-home endpoint, associated with its current sync session.

## Phone-home endpoint

- Central exposes one endpoint that accepts a list of `(table, id)` pairs for missing referenced records. It is used by both facility and mobile clients.
- The caller authenticates as the syncing facility or device the same way the sync endpoints do, and the request is tied to that caller's own sync session.
- The endpoint acknowledges receipt. It does not change the client's failure handling — the client's sync has already failed and will retry on its normal schedule, by which time healed records are available.

## Re-queuing missing records

For each reported `(table, id)`, central re-queues the record only when both hold:

- the record **exists** on central, and
- the record belongs to a **syncable** model.

- Re-queuing bumps the record's `updated_at_sync_tick` so the trigger restamps it with the current tick, causing it to be included in the reporting client's next pull. Re-queuing a record affects only that record.
- A reported record that **does not exist** on central cannot be healed by bumping. Central does not bump it and logs that the client reported a missing reference absent on central — a signal of genuine data loss worth investigating.
- A reported record whose model is **not syncable** is not bumped, because bumping it would not cause it to sync.

## Loop guard

To avoid endlessly re-queuing a record that never resolves, central tracks how many consecutive sync sessions a facility has reported the same record as missing, per `(facility, record)`.

- The consecutive count is derived by comparing the incoming report against the client's **previous sync session's** recorded phone-home entries: if the record was reported there, the count increments; if it was not, the count resets to one. A record therefore resets as soon as a later session does not report it — whether that session succeeds or fails on a different record.
- Central stops bumping a record once it has been reported missing more than the threshold number of consecutive times. The record then keeps failing the client's sync, and the resulting sync failure surfaces through existing sync alerting; self-healing raises no separate alert.
- The threshold is an admin-configurable central setting, defaulting to **3**.

## Request volume cap

- A single phone-home request is capped at a maximum number of records. Central re-queues the records up to the cap and logs that the remainder were dropped.
- The cap is an admin-configurable central setting, defaulting to **500**.

## Visibility

- Each phone-home event is recorded in the sync session's `debug_info`: the facility, the reported record's table and id, the consecutive count, and the action central took (re-queued, skipped over threshold, skipped as absent on central, skipped as non-syncable, or dropped over the request cap).
- Recording into `debug_info` is best-effort; a dropped write means the loop guard may permit one extra bump, which is safe.
- Frequency and recurrence are read back from the recorded events across sync sessions; alerting on persistent problems relies on the sync failures the unresolved references continue to cause.
