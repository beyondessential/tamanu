---
id: DISCHMED
---

# Discharge medications

The medication section of the discharge form lists the patient's encounter medications and their other ongoing medications, and captures the quantity to dispense for each. Where pharmacy orders are enabled, it doubles as the pharmacy order for the discharge: the clinician picks which medications to send, and finalising the discharge places the order.

Medications are grouped into two tables — encounter medication and other ongoing medication — each listing the medication, its dispensing quantity, repeats, whether it is ongoing, and an action to discontinue it.

## Dispensing quantity

- [ ] Each medication row captures the quantity to dispense, labelled "Dispensing qty", shown with the medication's dispensing unit.
- [ ] A dispensing quantity is required for every listed medication, in both tables, whether or not pharmacy orders are enabled.
- [ ] Zero is a valid dispensing quantity, but not on a medication being sent to pharmacy — those are dispensing at least one. Negative quantities are never accepted.
- [ ] A discharge cannot be finalised while any listed medication is missing a valid dispensing quantity.

## Pharmacy ordering

These columns and fields appear only where pharmacy orders are enabled for the deployment and the
clinician is permitted to create medication requests.

- [ ] A "Send to pharmacy" column lets the clinician choose which medications to include in the order.
- [ ] Encounter medications are selected by default. Other ongoing medications are not selected.
- [ ] Any listed medication can be selected.
- [ ] An "Ordering prescriber" field sits above the medication tables and records the prescriber placing the order. It carries an explanatory tooltip.
- [ ] Ordering prescriber defaults to the user completing the discharge, and is required.
- [ ] Ordering prescriber is inactive while no medication is selected to send to pharmacy.
- [ ] Finalising the discharge places a pharmacy order for the selected medications, using each row's dispensing quantity and repeats.
- [ ] Orders placed from a discharge are Outpatient/Discharge prescriptions, regardless of the deployment's default prescription type.
- [ ] Where a selected medication was already sent to pharmacy within the deployment's already-ordered window, finalising asks the clinician to confirm those medications before the order is placed, and lets them go back and amend the selection instead.

## Last sent

- [ ] Each row shows the date its medication was last sent to pharmacy, with the state of that request beneath it.
- [ ] The date shown is that of the most recent pharmacy order containing the medication, and the state shown is that of the same order — an active request until it has been dispensed, and dispensed thereafter.
- [ ] A medication whose dispense is later amended returns to being an active request.
- [ ] A medication that has never been sent to pharmacy is shown as not applicable.

## Stock

- [ ] Each row shows whether its medication is in stock at the facility: yes, no, or unknown.
- [ ] A medication that is in stock carries a tooltip giving the stock level held.
- [ ] The stock column appears only where at least one listed medication has a stock status recorded for the facility.

## Saving a draft

- [ ] Saving the discharge without finalising it preserves the dispensing quantities, repeats, send-to-pharmacy selections, and ordering prescriber.
- [ ] Saving a draft places no pharmacy order.
