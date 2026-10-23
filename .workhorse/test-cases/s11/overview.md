# Test cases: push progress tracking

Scenarios verifying that central records how far each sync client has pushed and that clients resume from the lower of central's cursor and their own. Behaviour: `specs/sync/push-progress.md` (PUSH). Most of these sit naturally as central/facility sync integration tests (alongside `FacilitySyncManager-integration.test.js` and the `CentralSyncManager` suites); the restore scenarios are simulated by rewinding or advancing the stored cursors rather than restoring real snapshots.

## Recording push progress

- [x] After a facility completes a push, central's stored cursor for that device equals the client tick the facility reported (its `currentSyncClockTime`). (verifies spec: PUSH)
- [x] A fresh device that has never pushed has no stored cursor on central (null). (verifies spec: PUSH)
- [ ] When the persist step fails or is interrupted, central's stored cursor is unchanged from before the push (advanced only in the save transaction). (verifies spec: PUSH)
- [x] Reporting a cursor lower than the one already stored leaves central's stored cursor unchanged. (verifies spec: PUSH)
- [ ] Central stores the cursor against the authenticated device, so two devices pushing in the same session window keep independent cursors. (verifies spec: PUSH)
- [ ] An empty push does not report a cursor, so central's cursor is unchanged; because the skipped range holds no records, the next push still delivers only new changes (no re-push churn). (verifies spec: PUSH)

## Resuming a push

- [x] At session start, central returns its stored cursor for the requesting device in the session metadata. (verifies spec: PUSH)
- [ ] With central's cursor equal to the client's local cursor (steady state), the client resumes from that value and pushes only changes stamped above it. (verifies spec: PUSH)
- [x] With central's cursor below the client's local cursor, the client resumes from central's (lower) value. (verifies spec: PUSH)
- [x] With central's cursor above the client's local cursor, the client resumes from its own (lower) local value. (verifies spec: PUSH)
- [x] When central holds no cursor for the client, the client resumes from its own local cursor alone, and does not re-push its whole history. (verifies spec: PUSH)
- [ ] After resuming, the client still advances and records its own local push cursor as each push completes. (verifies spec: PUSH)

## Consistency after a snapshot restore

- [ ] Restore-ahead: a client whose local cursor sits above central's stored cursor re-pushes the records in the gap, and central ends the session holding every record the client has. (verifies spec: PUSH)
- [ ] Restore-ahead: records the facility believed it had already pushed (local cursor above central) arrive on central rather than being skipped. (verifies spec: PUSH)
- [ ] Restore-behind: a client whose local cursor sits below central's stored cursor still delivers every change central has not persisted, including records written after the restore but before the first push (stamped at the pre-restore tick). (verifies spec: PUSH)
- [x] Restore-behind: central's stored cursor is not dragged backwards by the client's lower reported cursor. (verifies spec: PUSH)

## Mobile parity

- [ ] A mobile device reports its push cursor on push-complete and central stores it against the device, the same as a facility server. (verifies spec: PUSH)
- [ ] A mobile device resumes its push from the lower of central's cursor and its own local `LAST_SUCCESSFUL_PUSH`. (verifies spec: PUSH)

## Mixed-version behaviour

- [x] New client against a central with no stored cursor (upgrade): the client falls back to its local cursor; no mass re-push of history occurs on the first post-upgrade sync. (verifies spec: PUSH)
- [ ] Old client (does not report a cursor) against new central: the push succeeds and sync behaves as before.

## Regression / smoke

- [ ] A normal end-to-end facility sync (push then pull) still completes, with the usual records flowing both ways.
- [ ] `SyncDeviceTick` / sync-lookup echo-avoidance behaviour is unaffected by the new cursor (a device is not re-sent its own pushed changes on pull).
