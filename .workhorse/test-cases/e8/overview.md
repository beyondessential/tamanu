# SyncPatient permission test cases

Scenarios verifying who can deliberately mark a patient for sync, and that automatic marking is unaffected.

## Server endpoint

- [x] A user with `read Patient` and `create SyncPatient` marks a patient for sync at their facility, and an urgent sync is triggered (verifies spec: MFS)
- [x] Marking a patient already marked at the facility succeeds without a duplicate mark (verifies spec: MFS)
- [x] A user with `read Patient` but not `create SyncPatient` is refused, and no mark is created (verifies spec: MFS)
- [x] A user with `create SyncPatient` but not `read Patient` is refused (verifies spec: MFS)
- [x] Marking a patient that does not exist returns not found
- [x] An unauthenticated request is rejected and creates no mark (verifies spec: MFS)

## Upgrade migration

- [x] Every role with `read Patient` is granted `create SyncPatient`, under the ID the permissions importer would give it (verifies spec: MFS)
- [x] A role without `read Patient` is not granted it (verifies spec: MFS)
- [x] A role whose `read Patient` grant was revoked is not granted it (verifies spec: MFS)
- [x] A role that already has `create SyncPatient` is left with a single grant, and running the migration twice changes nothing
- [ ] After upgrading central and a facility, a facility user in a role with `read Patient` still sees "Sync patient records" (verifies spec: MFS)
- [ ] Re-importing a permissions sheet that does not mention `SyncPatient` leaves the migrated grants in place (verifies spec: MFS)
- [ ] Revoking `SyncPatient` for a role on central (`n` in the permissions sheet) reaches the facility on its next sync and hides the button (verifies spec: MFS)

## Desktop

- [x] A user with `create SyncPatient` viewing an unsynced patient sees "Sync patient records" in place of the encounter history (verifies spec: MFS)
- [x] A user without `create SyncPatient` viewing an unsynced patient sees the not-marked-for-sync message instead of the action (verifies spec: MFS)
- [ ] With the not-marked-for-sync message showing, the rest of the patient summary is unchanged (verifies spec: MFS)
- [ ] A user without `create SyncPatient` viewing a synced patient sees the encounter history as normal
- [ ] End-to-end: a permitted user opens an unsynced patient, clicks "Sync patient records", and the encounter history replaces the action (verifies spec: MFS)
- [ ] Desktop patient lists show the sync status column to a user without `create SyncPatient` (verifies spec: MFS)
- [ ] The admin permissions screen lists `SyncPatient` with the `create` verb (verifies spec: MFS)

## Mobile

- [x] A user with `create SyncPatient` sees the unsynced icon on an unsynced patient and can sync them (verifies spec: MFS)
- [x] A user without `create SyncPatient` sees no sync status on an unsynced patient (verifies spec: MFS)
- [x] A user without `create SyncPatient` sees the synced icon on a synced patient (verifies spec: MFS)
- [ ] Tapping the synced icon as a user without `create SyncPatient` shows the last successful sync (verifies spec: MFS)

## Automatic marking without the permission

- [ ] A user without `create SyncPatient` opening an encounter marks the patient for sync at the encounter location's facility (verifies spec: MFS)
- [ ] A user without `create SyncPatient` creating an outpatient appointment or location booking marks the patient for sync (verifies spec: MFS)
- [ ] A user without `create SyncPatient` registering a patient in a program registry marks them for sync at the registering facility (verifies spec: MFS)
- [ ] A user without `create SyncPatient` creating or editing a patient on mobile marks them for sync at the device's facility (verifies spec: MFS)
