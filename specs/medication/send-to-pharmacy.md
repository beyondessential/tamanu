---
id: PHORD
---

# Send to pharmacy

Applies to a prescriber sending selected prescriptions to the pharmacy from an active encounter or a patient's ongoing medications, specifying the ordering prescriber, quantity per item, and (for encounter orders) whether the request is inpatient or outpatient/discharge.

## Prescription list

- Each prescription row shows its medication, dose, frequency, and the stock status of that medication at the current facility.
- Stock status is one of: in stock, out of stock, or unknown (no stock information available for that medication at the facility).
- An in-stock medication's stock status carries the on-hand quantity as supporting detail.
- Stock status is informational only: a prescriber can select and send any prescription regardless of its stock status.

## Prescription type

- An order sent from an active encounter is either Inpatient or Outpatient/Discharge, chosen by the prescriber when sending.
- The choice starts on the facility's default prescription type setting: Inpatient, Outpatient/Discharge, or the encounter's type.
- When the default follows the encounter's type, an outpatient encounter starts on Outpatient/Discharge and any other encounter, including emergency and triage, starts on Inpatient.
- An order sent from a patient's ongoing medications is always Outpatient/Discharge, with no choice offered.
