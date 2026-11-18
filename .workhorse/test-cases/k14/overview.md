# Prescription type in dispensed and not dispensed details

Automated cases are covered by:

- the component tests in `packages/web/__tests__/components/Medication/DispenseDetailsModals.test.jsx`
- the endpoint tests in `packages/facility-server/__tests__/apiv1/Medication.test.js`
- the end to end tests in `packages/e2e-tests/tests/medication/medication.spec.ts` and `notDispensed.spec.ts`

## Dispensed medication modal

- [x] Left column reads Patient ID, Medication, Prescription type, Date dispensed, Qty dispensed, Instructions (verifies spec: DSPDET)
- [x] Right column reads Patient name, Prescription date, Request no., Dispensed by, Remaining repeats, Label text (verifies spec: DSPDET)
- [x] An Inpatient order shows Prescription type "Inpatient" (verifies spec: DSPDET)
- [x] An Outpatient/Discharge order shows "Outpatient/Discharge" in full (verifies spec: DSPDET)
- [x] Preset labels is not shown, even for a dispense that used a preset (verifies spec: DSPDET)

## Not dispensed medication modal

- [x] Left column reads Patient ID, Medication, Prescription type, Request no., Reason not dispensed (verifies spec: DSPDET)
- [x] Inpatient and Outpatient/Discharge orders show as Inpatient and Outpatient/Discharge (verifies spec: DSPDET)
- [x] Right column reads Patient name, Prescription date, Remaining repeats, Date not dispensed for an Outpatient/Discharge request, and leaves out Remaining repeats for an Inpatient one (verifies spec: DSPDET)

## Prescription type reaching the modals

- [x] Both dispensed medication lists return the prescription type of the order each fill was dispensed from, for Inpatient and Outpatient/Discharge orders (verifies spec: DSPDET)
- [ ] An Outpatient/Discharge dispense shows Outpatient/Discharge when opened from the pharmacy's Dispensed medications list and from the patient's Medication tab (verifies spec: DSPDET)
- [ ] An Outpatient/Discharge request marked not dispensed shows Outpatient/Discharge and Remaining repeats when opened from the encounter's Medication tab (verifies spec: DSPDET)

## Manual checks

- [ ] An order sent from ongoing medications shows Outpatient/Discharge in both modals (verifies spec: PHORD)
- [ ] An order raised from the discharge form shows Outpatient/Discharge in the Dispensed modal (verifies spec: PHORD)
- [ ] A new prescription sent straight to pharmacy shows the type chosen in the prescribing form (verifies spec: PHORD)
- [ ] Layout matches the Figma frame, with no field overflowing its column
- [ ] At a facility with preset labels, the dispense workflow still offers a preset for each item
- [ ] Editing a dispense that used a preset opens with that preset selected, from both the pharmacy's Dispensed medications list and the patient's Medication tab
- [ ] The medication requests table still shows Inpatient, and OP/Discharge with Outpatient/Discharge on hover
