---
id: MFS
---

# Marking patients for sync

Facility servers and mobile devices hold full records only for the patients marked for sync at their facility. A patient is marked either automatically, as a side effect of clinical work that establishes the patient at a facility, or deliberately by a user who wants the patient's full record pulled down. The deliberate action is governed by the `create` `SyncPatient` permission; the automatic ones are not.

## Automatic marking

- [ ] Opening an encounter for a patient marks them for sync at the facility of the encounter's location.
- [ ] Creating an outpatient appointment marks the patient for sync at the facility the appointment is booked for.
- [ ] Creating a location booking marks the patient for sync at the facility of the booked location.
- [ ] Registering a patient in a program registry marks them for sync at the registering facility.
- [ ] Creating a patient on a facility server marks them for sync at that facility.
- [ ] Creating or editing a patient on a mobile device marks them for sync at the device's facility.
- [ ] Automatic marking is a side effect of the clinical action, so it happens on behalf of any user permitted to perform that action, whatever their sync-marking permission.

## The SyncPatient permission

- [ ] `create` `SyncPatient` grants a user the ability to deliberately mark a patient for sync. It is the only verb the noun carries.
- [ ] The permission is granted and revoked through the usual role and permission configuration. Administrators see it in the permissions screen under its own name, `SyncPatient`, alongside the other nouns.
- [ ] Upgrading a deployment grants the permission to every existing role holding `read` `Patient` for all patients, so no user loses the action at upgrade. A deployment that wants the restriction revokes it from the relevant roles.
- [ ] Re-importing a permissions configuration that does not mention `SyncPatient` leaves existing grants of it in place.

## Marking a patient for sync on desktop

- [ ] A user viewing a patient who is not marked for sync at their facility is offered a "Sync patient records" action in place of the patient's encounter history.
- [ ] The action is offered only to a user holding `create` `SyncPatient`. Without it, the encounter history area instead shows the message "This patient record is not marked for sync at your facility. Please speak with your system administrator if this patient record should be synced." The rest of the patient summary is unaffected.
- [ ] Marking a patient for sync requires both `read` `Patient` and `create` `SyncPatient`. A request from a user missing either is refused.
- [ ] A user marks a patient for sync only at the facility they are signed in to. A request naming any other facility is refused.
- [ ] Marking a patient already marked at that facility succeeds without creating a duplicate mark.
- [ ] Marking a patient for sync triggers an urgent sync so their records begin arriving immediately, and the user is told the patient is being synced while records are still incomplete.

## Marking a patient for sync on mobile

- [ ] A patient's sync status is shown on the patient's details, and tapping it offers to sync an unsynced patient or reports the last successful sync for a synced one.
- [ ] Syncing a patient from mobile marks them for sync at the device's facility, so the facility server and every device at that facility pull the patient's records.
- [ ] For a patient not marked for sync at the device's facility, the sync status is shown only to a user holding `create` `SyncPatient`. Without it, no sync status is shown and there is no way to sync the patient.
- [ ] For a patient marked for sync at the device's facility, the sync status is shown to every user, whatever their sync-marking permission.
- [ ] Mobile enforces the permission in the client only, consistent with how mobile applies its other permissions.

## Sync status in desktop patient lists

- [ ] Desktop patient lists show each patient's sync status regardless of the viewer's sync-marking permission, since it describes the completeness of the record rather than offering an action.
