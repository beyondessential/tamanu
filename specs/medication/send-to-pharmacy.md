---
id: PHORD
---

# Send to pharmacy

Applies to a prescriber sending prescriptions to the pharmacy, whether selected from an active encounter or a patient's ongoing medications, written as a new prescription in an encounter, or ordered at discharge, specifying the ordering prescriber, quantity per item, and the prescription type.

## Prescription list

- Each prescription row shows its medication, dose, frequency, and the stock status of that medication at the current facility.
- Stock status is one of: in stock, out of stock, or unknown (no stock information available for that medication at the facility).
- An in-stock medication's stock status carries the on-hand quantity as supporting detail.
- Stock status is informational only: a prescriber can select and send any prescription regardless of its stock status.

## Prescription type

- An order sent from an active encounter is either Inpatient or Outpatient/Discharge, chosen by the prescriber when sending.
- A new prescription written in an encounter and sent straight to pharmacy has its type chosen in the prescribing form, and is not sent without one.
- Both choices start on the facility's default prescription type setting: Inpatient, Outpatient/Discharge, or the encounter's type.
- When the default follows the encounter's type, an outpatient encounter starts on Outpatient/Discharge and any other encounter, including emergency and triage, starts on Inpatient.
- An order sent from a patient's ongoing medications is always Outpatient/Discharge, with no choice offered.
- An order raised when discharging a patient is always Outpatient/Discharge, whatever the facility's default.
