# C5 · Discharge blocked by required "Dispensing qty" when nothing is being sent to pharmacy

Regression #15 (v2.62.0). Two problems reported against the discharge modal's medication section.

## Diagnosis

Both problems live in `packages/web/app/forms/DischargeMedicationColumns.jsx`.

### Problem 2 — ordering-clinician asterisk (fixed)

`OrderingPrescriberField` hard-coded `required` on the field, so the red asterisk showed even while
the field was disabled (nothing selected to send to pharmacy). The actual validation
(`DischargeForm.jsx`) only requires the ordering prescriber when a medication is being sent, so the
asterisk contradicted the real rule. Fixed by making `required` track `isSendingAnyMedication`, which
the component already computes.

### Problem 1 — dispensing qty always required (changed, on Design's call)

Initially settled as as-designed: the schema required a quantity for every listed medication, with
tests asserting a blank was rejected even when not sending to pharmacy. **Design then asked for blank
or zero to be accepted when "send to pharmacy" is unticked**, so that decision was reversed.

The prescription form was already the precedent for this: its quantity is only required when
`sendToPharmacy` is set, and its field marks itself `required={values.sendToPharmacy}`. The discharge
form was the odd one out.

The field stays able to be empty — no blur-to-zero coercion. A blank is normalised to zero on the
server instead.

#### What changed

- **Shared frontend rule** — `dispensingQuantitySchema` in `packages/web/app/utils/validation.js`,
  used by both `MedicationForm.jsx` and `DischargeMedicationColumns.jsx` so the two cannot drift. A
  quantity may be blank; it is only demanded, and only has to be at least one, when the row is being
  sent to pharmacy.
- **Shared backend normalisation** — `DISPENSING_QUANTITY_SCHEMA` and `REPEATS_SCHEMA` in
  `medicationValidationSchema.js` map every spelling of "nothing entered" (`''`, `null`, `undefined`,
  absent key) to zero. Used by the prescription input schema and by the new
  `DISCHARGE_MEDICATIONS_SCHEMA`.
- **The discharge route now parses its medications payload.** `PUT /encounter/:id` previously read
  `req.body.medications` raw and handed values straight to `prescription.update()`. That is why a
  blank quantity would have reached Sequelize as `''` and failed its integer validation mid
  transaction, rolling the whole discharge back. It now goes through the shared schema.
- **The quantity column header no longer carries a required ornament**, since a quantity is only
  required of the rows being sent to pharmacy — marking the whole column would overstate the rule.

#### Consequence worth knowing

A blank quantity is now stored as `0` rather than `NULL`. Existing rows are untouched; this only
affects prescriptions written or discharged from here on.

## Open question — unticked rows still overwrite the stored quantity

`encounter.js` writes `prescription.update({ quantity, repeats })` for **every** listed prescription,
with no `sendToPharmacy` check. So a row the clinician is not dispensing still stamps its quantity
onto the prescription — including rows in the "Other ongoing medication" table, whose prescriptions
belong to the patient rather than to this encounter.

Not changed here, because it is a product decision rather than a defect: should an unticked row record
its quantity against the prescription at all? Raised with the user; still open.

## Test coverage

- Two regression guards in `DischargeForm.test.jsx` for the ordering-prescriber asterisk state.
- `DischargeForm.test.jsx` quantity cases flipped to assert blank is accepted when not sending.
- New `packages/facility-server/__tests__/medicationValidationSchema.test.js` covering the shared
  normalisation: blank/null/undefined to zero, negatives and non-numerics rejected, discharge rows
  normalised without dropping medications.

Note: the facility-server **integration** suites (`__tests__/apiv1/*`) do not run on this machine —
the local facility test database is not set up, and they fail identically with and without these
changes. The schema unit test above runs fine.
