---
id: SYNCHK
---

# Changes-pending check

Before a facility server or a mobile device opens a sync session with central, it asks central whether there is anything for it to pull. A device with nothing to push and nothing to pull then opens no session, so an idle device costs central almost nothing, and does not keep a sleeping central awake (see `platform/supervisor/sleep-and-wake.md`).

## Highest real-change tick

- [ ] The highest real-change sync tick is the highest sync tick in the sync lookup table (see `sync/lookup-table.md`). It moves only when a record that syncs to devices changes, not when central's sync clock advances for any other reason.
- [ ] Pending-update markers in the lookup table never count as the highest real-change tick.
- [ ] Reading the highest real-change tick is cheap enough to answer on every check.
- [ ] Central's api can run a sync lookup refresh on demand, for central's own supervisor only, and return the highest real-change tick once the refresh has committed. The supervisor uses this at sleep.

## The check

- [ ] The check is a request to central carrying the device's pull cursor: the tick its last successful pull reached, or a marker that it has never pulled.
- [ ] The check needs a valid access token for a device that may sync.
- [ ] The answer is that there are changes to pull when the highest real-change tick is above the device's pull cursor, and when the device has never pulled.
- [ ] The answer is that there is nothing to pull otherwise.
- [ ] The check is answered at the same address whether central is awake or asleep. While central is asleep, its supervisor answers it (see `platform/supervisor/serving-while-asleep.md#changes-pending-check`).
- [ ] A device's own pushes can bring the highest real-change tick above its pull cursor, so the check can answer that there are changes for one session that then pulls nothing. The next check after that session answers that there is nothing to pull.

## Recording the device as seen

- [ ] Each check updates the calling device's last-seen time, so the time a device last contacted central stays accurate when it opens no session.
- [ ] While central is awake, central updates the last-seen time. While central is asleep, its supervisor records it and hands it back on wake.

## Facility servers

- [ ] On each scheduled sync, a facility server that has local changes to push opens a session without checking.
- [ ] Otherwise, it checks first, and opens a session only when the answer is that there are changes to pull.
- [ ] A sync the user or a process asks for explicitly opens a session without checking.
- [ ] A facility server that cannot reach central for the check treats it as a failed sync, as it would a failed session.

## Mobile devices

- [ ] On each scheduled sync, a mobile device that has local changes to push opens a session without checking.
- [ ] Otherwise, it checks first, and opens a session only when the answer is that there are changes to pull.
- [ ] A sync the user starts by hand, and the initial sync after selecting the device's facility, open a session without checking.
