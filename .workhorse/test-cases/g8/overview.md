# Field filtering on simplePut and simplePost

Coverage for restricting `simplePut` and `simplePost` to a declared `allowedFields` set, the
way `simplePatch` already does. Two things need proving at every endpoint the helpers are
mounted on: nothing outside `allowedFields` reaches the database, and the bodies real
clients already send keep working.

The helpers filter rather than reject, because a PUT body is the whole record the client
last read: the web spreads a fetched record into its form and sends it all back, ids and
audit timestamps included. Rejecting unknown keys the way `simplePatch` does would break
every one of those endpoints.

## Helper contract

Unit tests in `packages/shared/__tests__/utils/crudHelpers.test.js`.

- [x] `simplePut`, `simplePost` and `simplePatch` each refuse to build a route with no `allowedFields`
- [x] Each refuses to build a route with an empty `allowedFields`
- [x] Each rejects `createdAt`, `updatedAt`, `deletedAt` and `updatedAtSyncTick` as allowed fields
- [x] Each rejects an allowed field the model does not have

## Endpoint behaviour

Integration tests in `packages/facility-server/__tests__/apiv1/crudHelperFieldFiltering.test.js`,
covering all 12 facility endpoints the helpers are mounted on.

- [x] Each POST endpoint creates a record from the body its client sends
- [x] Each POST endpoint ignores a client-supplied `createdAt`
- [x] Each PUT endpoint accepts the whole record the client read back, and applies the edit
- [x] Each PUT endpoint ignores a client-supplied `createdAt`
- [x] `PUT allergy`, `ongoingCondition`, `familyHistory`, `patientIssue` and `patientCarePlan` cannot move a record to another patient
- [x] `PUT diagnosis` and `vitals` cannot move a record to another encounter
- [x] `PUT referral` cannot repoint the referral at another initiating encounter
- [x] `POST` and `PUT referenceData` cannot set `systemRequired`, which the importer treats as protected

The central-server admin template routes, in `packages/central-server/__tests__/admin/template.test.js`.

- [x] `PUT admin/template` accepts the whole template the admin panel sends back
- [x] `POST` and `PUT admin/template` ignore a client-supplied `createdAt`

## Manual verification

Scenarios where the round-trip body is produced by the real client rather than simulated.

- [ ] Edit an allergy, ongoing condition, family history entry, patient issue and care plan from the patient info pane, and confirm each saves
- [ ] Edit an encounter diagnosis from the diagnosis modal, and confirm it saves
- [ ] Complete and cancel a referral from the referral table, and confirm the status changes
- [ ] Create, edit and delete a patient letter template in the admin panel
- [ ] Email a vaccine certificate and confirm the notification is still picked up and sent
