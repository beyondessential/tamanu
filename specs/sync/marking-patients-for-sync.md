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
- [ ] The permission is granted and revoked through the usual role and permission configuration. Administrators see it in the permissions screen under its own name, `SyncPatient`, alongside the other nouns.
- [ ] Upgrading a deployment grants the permission to every existing role that can read patients, so no user loses the action at upgrade. A deployment that wants the restriction revokes it from the relevant roles.
- [ ] Re-importing a permissions configuration that does not mention `SyncPatient` leaves existing grants of it in place.

## Marking a patient for sync on desktop

- [ ] A user viewing a patient who is not marked for sync at their facility is offered a "Sync patient records" action in place of the patient's encounter history.
- [ ] The action is offered only to a user holding `create` `SyncPatient`. Without it, the encounter history area instead shows the message "This patient record is not marked for sync at your facility. Please speak with your system administrator if this patient record should be synced." The rest of the patient summary is unaffected.
- [ ] Marking a patient for sync requires both `read` `Patient` and `create` `SyncPatient`. A request from a user missing either is refused.
- [ ] A user marks a patient for sync only at the facility they are signed in to. A request naming any other facility is refused.
- [ ] Marking a patient for sync is idempotent: marking a patient already marked at that facility succeeds and changes nothing.
- [ ] Marking a patient for sync triggers an urgent sync so their records begin arriving immediately, and the user is told the patient is being synced while records are still incomplete.

## Marking a patient for sync on mobile

- [ ] A patient's sync status is shown on the patient's details, and tapping it offers to sync an unsynced patient or reports the last successful sync for a synced one.
- [ ] For a patient not marked for sync on the device, the sync status is shown only to a user holding `create` `SyncPatient`. Without it, no sync status is shown and there is no way to sync the patient.
- [ ] For a patient marked for sync on the device, the sync status is shown to every user, whatever their sync-marking permission.
- [ ] Mobile enforces the permission in the client only, consistent with how mobile applies its other permissions.

## Sync status elsewhere

- [ ] A patient's sync status is reported in patient lists regardless of the viewer's sync-marking permission, since it describes the completeness of the record rather than offering an action.
