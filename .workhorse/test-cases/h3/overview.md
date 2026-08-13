# Test cases: discontinued medications dispensable from pharmacy queue

Covers the warn-but-allow behaviour for prescriptions discontinued after they were sent to pharmacy, through the queue, the dispense workflow, and the dispensed record.

## Pharmacy queue

- [ ] A prescription discontinued after being sent to pharmacy still appears in the pharmacy queue (verifies spec: PHDIS)
- [ ] That queue row shows a "Discontinued" tag next to the medication name (verifies spec: PHDIS)
- [ ] Hovering the tag shows the discontinuation date and the recorded reason (verifies spec: PHDIS)
- [ ] A request whose prescription is not discontinued shows no tag (verifies spec: PHDIS)
- [x] The tag renders nothing when the prescription is absent or not discontinued, and still renders with no date/reason recorded (verifies spec: PHDIS)

## Dispense workflow

- [ ] Opening dispense for a patient with a discontinued request lists that request (verifies spec: PHDIS)
- [ ] The discontinued request is unticked on open, while non-discontinued requests stay ticked (verifies spec: PHDIS)
- [ ] A warning banner appears when any listed request is discontinued, and is absent otherwise (verifies spec: PHDIS)
- [ ] Ticking the discontinued request and dispensing succeeds, and records the dispense (verifies spec: PHDIS)
- [ ] Dispensing with only non-discontinued requests ticked is unaffected by the discontinued row (verifies spec: PHDIS)
- [ ] "Select all" ticks the discontinued request too, as an explicit pharmacist action (verifies spec: PHDIS)

## Dispensed records

- [x] A dispensed fill whose prescription is discontinued is tagged in the dispensed-medications list (verifies spec: PHDIS)
- [x] A dispensed fill whose prescription is active carries no tag (verifies spec: PHDIS)
- [x] A fill both discontinued and modified by pharmacy shows the tag and the modified asterisk together (verifies spec: PHDIS)
- [x] The dispensed medication details modal shows the tag next to the medication, and passes the prescription rather than the dispensed medication through to it (verifies spec: PHDIS)
- [ ] The patient medication pane's dispensed table shows the tag (verifies spec: PHDIS)
- [ ] The edit dispensed medication modal shows the tag against the medication being edited (verifies spec: PHDIS)

## Ordering (unchanged behaviour, guard against regression)

- [ ] A discontinued prescription cannot be added to a new pharmacy order (verifies spec: PHDIS)

## Backend

- [ ] `GET medication/medication-requests` returns `discontinued` on the prescription (verifies spec: PHDIS)
- [ ] `GET medication/dispensable-medications` returns the discontinuation fields, and does not filter discontinued rows out (verifies spec: PHDIS)
- [ ] `GET medication/medication-dispenses` returns the discontinuation fields on the prescription (verifies spec: PHDIS)
- [ ] `GET patient/:id/dispensed-medications` returns the discontinuation fields on the prescription (verifies spec: PHDIS)
- [ ] `POST medication/dispense` succeeds for a discontinued prescription (verifies spec: PHDIS)
- [ ] `POST medication/dispense` still 404s for a pharmacy order prescription id that does not exist (verifies spec: PHDIS)

## Notes

The backend cases are unticked because the facility-server integration suite could not be run in this worktree: it has no dependency install, and the test database could not be provisioned with a toolchain borrowed from a sibling worktree. They are owed coverage in `packages/facility-server/__tests__/apiv1/Medication.test.js` and the patient route tests.

The unticked UI cases are per-surface renders of the same shared components (`DispensedMedicationName`, `MedicationNameWithDiscontinuedTag`), whose behaviour is covered by the ticked unit tests; they remain owed as manual or component-level checks that each surface passes the prescription through. The details modal now has that wiring check; the patient pane and edit modal still owe one.

These are deliberately unit/component tests rather than e2e: per `llm/project-rules/playwright-e2e.md`, e2e is reserved for business-critical multi-step journeys, and a tag rendering is granular UI detail that belongs at the cheaper level.
