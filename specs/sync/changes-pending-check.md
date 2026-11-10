---
id: SYNCHK
---

# Changes-pending check

Applies to the check a facility server or a mobile device makes before opening a scheduled sync session, asking central whether anything that syncs has changed since its last pull.

## Highest real-change tick

- The highest real-change sync tick is the highest settled sync tick in the [sync lookup table](lookup-table.md). It moves only when a record that syncs to devices changes, not when central's sync clock advances for any other reason.
- Pending-update markers in the lookup table never count as the highest real-change tick.
- The highest real-change tick is read from the lookup table's index on sync tick, without scanning the table.
- With the lookup table turned off in central's configuration, the check always answers that there are changes to pull.

## The check

- The check is a request to central carrying the device's pull cursor: the tick its last successful pull reached, or a marker that it has never pulled.
- The check needs a valid access token for a device registered with the sync client scope.
- The answer is that there are changes to pull when the highest real-change tick is above the device's pull cursor, and when the device has never pulled.
- The answer is that there is nothing to pull otherwise.
- The check is answered at the same address whether central is awake or asleep. While central is asleep, [its supervisor answers it](../platform/supervisor/serving-while-asleep.md#changes-pending-check).
- A device's own pushes can bring the highest real-change tick above its pull cursor, so the check can answer that there are changes for one session that then pulls nothing. The next check after that session answers that there is nothing to pull.

> [!NOTE]
> Central accepts facility servers and mobile devices only on its own minor version, so a device that makes the check never meets a central without it.
>
> A device with nothing to push and nothing to pull opens no session at all, so an idle device costs central almost nothing and does not keep a [sleeping central](../platform/supervisor/sleep-and-wake.md) awake.

## Facility servers

- A scheduled sync, including the one at start-up, checks first and opens a session only when the answer is that there are changes to pull.
- A scheduled sync opens a session without checking when the facility has local changes to push.
- A sync that the check answers with nothing to pull still does the provisioning a facility does after a session: swapping to its dedicated sync user, and obtaining the [settings PSK](../administration/settings/secret-encryption.md).
- A sync that a user asks for, a sync triggered by a patient being marked for sync, and the sync subcommand open a session without checking.
- A facility server that cannot reach central for the check, or cannot read its answer, treats it as a failed sync, as it would a failed session.
- A scheduled sync that the check answers with nothing to pull is a successful sync: the facility's last successful sync time moves, and its pull cursor does not.

## Mobile devices

- A scheduled sync checks first and opens a session only when the answer is that there are changes to pull.
- A scheduled sync opens a session without checking when the device has local changes to push, or has tables waiting for a full resync after an app upgrade.
- Signing in, reconnecting with a password, selecting the device's facility (which runs the initial sync), a sync the user starts by hand, and urgent syncs open a session without checking.
- A device that cannot reach central for the check, or cannot read its answer, treats it as a failed sync.
- A scheduled sync that the check answers with nothing to pull is a successful sync: the "last synced" time shown to the user moves, and the pull cursor does not.

## While central wakes

- A sync client whose session start gets `503 Service Unavailable` with a `Retry-After` header, as a [waking central](../platform/supervisor/sleep-and-wake.md#waking) answers, waits in line as a queued sync does, and tries again at its next sync.
- A check answered that way is left to the session start.
- The `Retry-After` header is what marks central as waking. A `503` without one is an ordinary failure, so an overloaded central, or an address with nothing behind it, fails the sync.
- A sync that meets a waking central is not a failed sync.
