---
id: DSPDET
---

# Dispensed and not dispensed medication details

Applies to the details window opened from a dispensed medication or a medication request marked not dispensed, wherever it is opened from: the pharmacy's dispensed medications list and the patient's medications.

## Prescription type

- Both windows show the prescription type of the pharmacy order the medication was requested on: Inpatient or Outpatient/Discharge.
- The prescription type is the one chosen when the order was [sent to pharmacy](send-to-pharmacy.md), and an order sent from a patient's ongoing medications is always Outpatient/Discharge.
- The type is shown in full, not as the abbreviated form the medication requests list uses.

> [!NOTE]
> Whether a medication was ordered as inpatient or outpatient/discharge affects whether it appears on the invoice, since discharge medications are billed separately where an [inpatient fee bundles medications](../invoicing/encounter-fees.md#inpatient-fee-inclusions-and-exclusions), so staff answering invoice queries need to see the type from the dispensed record itself.

## Dispensed medication

- The window shows the patient ID, patient name, medication, prescription date, prescription type, date dispensed, dispensed by, quantity dispensed, request number, instructions, remaining repeats and label text.
- The preset label used for the dispense is shown by its code only at facilities that have preset labels set up, and shows a dash where none was used.

## Not dispensed medication

- The window shows the patient ID, patient name, medication, prescription date, prescription type, request number, reason not dispensed and date not dispensed.
- Remaining repeats are shown only for an Outpatient/Discharge request.
