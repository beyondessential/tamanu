---
id: MFS
---

# Marking patients for sync

A facility server and a mobile device hold data only for the patients marked for sync at that facility or on that device. A patient is marked either automatically, as a side effect of clinical work that establishes the patient at the facility, or deliberately by a user who wants the patient's full record pulled down. The deliberate action is governed by the `create` `SyncPatient` permission; the automatic ones are not.

## Automatic marking

- [ ] A patient is marked for sync at a facility when an encounter is opened for them at that facility, when an appointment is created or rescheduled for them at that facility, when they are registered in a program registry, or when they are newly created at that facility.
- [ ] Automatic marking is a side effect of the clinical action, so it happens on behalf of any user permitted to perform that action, whatever their sync-marking permission.
- [ ] On mobile, a patient is marked for sync on the device when they are created or edited on that device.

## The SyncPatient permission

- [ ] `create` `SyncPatient` grants a user the ability to deliberately mark a patient for sync. It is the only verb the noun carries.
- [ ] The permission is granted per deployment through the usual role and permission configuration, and no role holds it until an administrator grants it. Administrators see it in the permissions screen under its own name, `SyncPatient`, alongside the other nouns.

## Marking a patient for sync on desktop

- [ ] A user viewing a patient who is not marked for sync at their facility is offered a "Sync patient records" action in place of the patient's encounter history.
- [ ] The action is offered only to a user holding `create` `SyncPatient`. Without it, nothing is rendered in place of the encounter history: no action, no table, and no empty panel. The rest of the patient summary is unaffected.
- [ ] Marking a patient for sync requires both `read` `Patient` and `create` `SyncPatient`. A request from a user missing either is refused.
- [ ] Marking a patient for sync is idempotent: marking a patient already marked at that facility succeeds and changes nothing.
- [ ] Marking a patient for sync triggers an urgent sync so their records begin arriving immediately, and the user is told the patient is being synced while records are still incomplete.

## Marking a patient for sync on mobile

- [ ] A patient's sync status is shown on the patient's details, and tapping it offers to sync an unsynced patient or reports the last successful sync for a synced one.
- [ ] The sync status is shown for an unsynced patient only to a user holding `create` `SyncPatient`. Without it, an unsynced patient shows no sync status and no way to sync them.
- [ ] Mobile enforces the permission in the client only, consistent with how mobile applies its other permissions.

## Sync status elsewhere

- [ ] A patient's sync status is reported in patient lists regardless of the viewer's sync-marking permission, since it describes the completeness of the record rather than offering an action.
