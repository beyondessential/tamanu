---
id: DSPDET
---

# Dispensed and not dispensed medication details

Applies to the details window opened from a dispensed medication or a medication request marked not dispensed, wherever it is opened from: the pharmacy's dispensed medications list and the patient's medications.

## Prescription type

- Both windows show the prescription type of the pharmacy order the medication was requested on: Inpatient or Outpatient/Discharge.
- The prescription type is the one chosen when the order was [sent to pharmacy](send-to-pharmacy.md), and an order sent from a patient's ongoing medications is always Outpatient/Discharge.
- The type is shown by its full label.

> [!NOTE]
> Whether a medication was ordered as inpatient or outpatient/discharge affects whether it appears on the invoice, since discharge medications are billed separately where an [inpatient fee bundles medications](../invoicing/encounter-fees.md#inpatient-fee-inclusions-and-exclusions), so staff answering invoice queries need to see the type from the dispensed record itself.

## Dispensed medication

- The left column shows, top to bottom: Patient ID, Medication, Prescription type, Date dispensed, Qty dispensed and Instructions.
- The right column shows, top to bottom: Patient name, Prescription date, Request no., Dispensed by, Remaining repeats and Label text.
- At facilities that have preset labels set up, Preset labels follows Label text, showing the code of the preset used for the dispense, or a dash where none was used.

## Not dispensed medication

- The left column shows, top to bottom: Patient ID, Medication, Prescription type, Request no. and Reason not dispensed.
- The right column shows, top to bottom: Patient name, Prescription date, Remaining repeats and Date not dispensed.
- Remaining repeats is shown only for an Outpatient/Discharge request.
