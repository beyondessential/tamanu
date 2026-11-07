---
id: SYNCHK
---

# Changes-pending check

Before a facility server or a mobile device opens a scheduled sync session with central, it asks central whether anything that syncs has changed since its last pull. A device with nothing to push and nothing to pull then opens no session, so an idle device costs central almost nothing, and does not keep a sleeping central awake (see `platform/supervisor/sleep-and-wake.md`).

## Highest real-change tick

- [ ] The highest real-change sync tick is the highest settled sync tick in the sync lookup table (see `sync/lookup-table.md`). It moves only when a record that syncs to devices changes, not when central's sync clock advances for any other reason.
- [ ] Pending-update markers in the lookup table never count as the highest real-change tick.
- [ ] The highest real-change tick is read from the lookup table's index on sync tick, without scanning the table.
- [ ] With the lookup table turned off in central's configuration, the check always answers that there are changes to pull.

## The check

- [ ] The check is a request to central carrying the device's pull cursor: the tick its last successful pull reached, or a marker that it has never pulled.
- [ ] The check needs a valid access token for a device registered with the sync client scope.
- [ ] The answer is that there are changes to pull when the highest real-change tick is above the device's pull cursor, and when the device has never pulled.
- [ ] The answer is that there is nothing to pull otherwise.
- [ ] The check is answered at the same address whether central is awake or asleep. While central is asleep, its supervisor answers it (see `platform/supervisor/serving-while-asleep.md#changes-pending-check`).
- [ ] The check only ever saves a session that would have found nothing, so anything other than a clear answer of nothing to pull opens a session. A central server old enough not to have the check, which a device upgraded ahead of it meets, therefore keeps syncing rather than failing every scheduled sync.
- [ ] A device's own pushes can bring the highest real-change tick above its pull cursor, so the check can answer that there are changes for one session that then pulls nothing. The next check after that session answers that there is nothing to pull.

## Recording the device as seen

- [ ] A check, and the start of a sync session, update the calling device's last-seen time when the stored time is older than a short interval. A device that checks often writes it at most every few minutes, so the change log is not flooded.
- [ ] The last-seen time therefore stays accurate as the time a device last contacted central, whether or not it opens sessions.

## Facility servers

- [ ] A scheduled sync, including the one at start-up, checks first and opens a session only when the answer is that there are changes to pull.
- [ ] A scheduled sync opens a session without checking when the facility has local changes to push, has not yet obtained the settings PSK (see `administration/settings/secret-encryption.md`), or still syncs as a user other than its dedicated sync user.
- [ ] A sync that a user asks for, a sync triggered by a patient being marked for sync, and the sync subcommand open a session without checking.
- [ ] A facility server that cannot reach central for the check treats it as a failed sync, as it would a failed session.
- [ ] A scheduled sync that the check answers with nothing to pull is a successful sync: the facility's last successful sync time moves, and its pull cursor does not.

## Mobile devices

- [ ] A scheduled sync checks first and opens a session only when the answer is that there are changes to pull.
- [ ] A scheduled sync opens a session without checking when the device has local changes to push, or has tables waiting for a full resync after an app upgrade.
- [ ] Signing in, reconnecting with a password, selecting the device's facility (which runs the initial sync), a sync the user starts by hand, and urgent syncs open a session without checking.
- [ ] A device that cannot reach central for the check treats it as a failed sync.
- [ ] A scheduled sync that the check answers with nothing to pull is a successful sync: the "last synced" time shown to the user moves, and the pull cursor does not.

## While central wakes

- [ ] A sync client whose check or session start gets `503 Service Unavailable` with a `Retry-After` header, as a waking central answers (see `platform/supervisor/sleep-and-wake.md#waking`), waits for that long and tries again within the same sync, for as long as central keeps answering that it is waking. A login the client makes for itself during the check or session start waits in the same way.
- [ ] The `Retry-After` header is what marks central as waking. A `503` without one is an ordinary failure, so an overloaded central, or an address with nothing behind it, fails the sync instead of holding it for the whole waiting time.
- [ ] Waiting for a waking central is not a failed sync.
