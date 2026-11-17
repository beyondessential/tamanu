# Prescription type in dispensed and not dispensed details

Automated cases are covered by `packages/web/__tests__/components/Medication/DispenseDetailsModals.test.jsx`, written without being run locally; tick them once CI passes.

## Dispensed medication modal

- [ ] Left column reads Patient ID, Medication, Prescription type, Date dispensed, Qty dispensed, Instructions (verifies spec: DSPDET)
- [ ] Right column reads Patient name, Prescription date, Request no., Dispensed by, Remaining repeats, Label text (verifies spec: DSPDET)
- [ ] An Inpatient order shows Prescription type "Inpatient" (verifies spec: DSPDET)
- [ ] An Outpatient/Discharge order shows "Outpatient/Discharge" in full (verifies spec: DSPDET)
- [ ] Preset labels is not shown, even for a dispense that used a preset (verifies spec: DSPDET)

## Not dispensed medication modal

- [ ] Left column reads Patient ID, Medication, Prescription type, Request no., Reason not dispensed (verifies spec: DSPDET)
- [ ] Inpatient and Outpatient/Discharge orders show as Inpatient and Outpatient/Discharge (verifies spec: DSPDET)

## Manual checks

- [ ] Open a dispensed medication from the pharmacy's Dispensed medications list and see its prescription type
- [ ] Open a dispensed medication from the patient's Medication tab and see the same prescription type
- [ ] Open a not dispensed request from the encounter's Medication tab and see its prescription type
- [ ] An order sent from ongoing medications shows Outpatient/Discharge in both modals (verifies spec: PHORD)
- [ ] Layout matches the Figma frame, with no field overflowing its column
- [ ] At a facility with preset labels, the dispense workflow still offers a preset for each item
- [ ] Editing a dispense that used a preset opens with that preset selected, from both the pharmacy's Dispensed medications list and the patient's Medication tab
- [ ] The medication requests table still shows Inpatient, and OP/Discharge with Outpatient/Discharge on hover
