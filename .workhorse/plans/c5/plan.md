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

### Problem 1 — dispensing qty always required (left as-is, needs a decision)

The complaint is that "Dispensing qty" blocks discharge even when nothing is sent to pharmacy. This is
**deliberate, documented behaviour**, not a coding defect:

- The schema requires a quantity for every listed medication, with an explicit comment: the discharge
  records a dispensing quantity against the prescription whether or not it goes to pharmacy; only the
  floor changes (zero is fine unless the row is being sent, where it must be at least one).
- Tests assert exactly this (`DischargeForm.test.jsx`): a blank quantity is rejected as required even
  when not sending to pharmacy, while zero is accepted.

So the intended workflow is: enter a quantity (zero is acceptable when not dispensing) or discontinue
the line to remove it. The reporter hit friction because medications with no pre-existing quantity
start blank, and a blank field blocks discharge.

Changing this would contradict the shipped spec (TAM-6895) and its tests. **Left unchanged pending
confirmation against the Linear spec / product decision**, per the card's "settle first" note.

## Test coverage

- Added two regression guards in `DischargeForm.test.jsx` for the ordering-prescriber asterisk state
  (not marked required with nothing selected; marked required once a medication is being sent).
