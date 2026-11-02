---
id: DQLIM
---

# Dose and dispensing quantity limits

Each drug can carry an accepted range for its dose amount and for its dispensing quantity, to catch values entered in the wrong unit (500 tablets where 500 mg was meant) before they flow through to dispensing and invoicing. When a value entered while prescribing, sending to pharmacy, or dispensing falls outside the range, a warning appears inline below the field. The warning does not block saving: saving with a value outside the range is an override, which is recorded and flagged to pharmacy.

## Configuration

- [ ] Each drug has four optional limits: minimum dose, maximum dose, minimum dispensing quantity, and maximum dispensing quantity.
- [ ] Dose limits are in the drug's dosing unit, and dispensing quantity limits are in the drug's dispensing unit.
- [ ] Each limit stands on its own, so a drug can have any combination of them. A drug with no limits never shows a warning.
- [ ] Limits are set on the Drug reference data, through both the import spreadsheet and the admin panel's reference data management, and are included when drugs are exported.
- [ ] The importer rejects a drug row with a limit that is not a positive number, a dispensing quantity limit that is not a whole number, or a minimum greater than its matching maximum.
- [ ] A drug's limits apply at every facility.

## Range check

- [ ] A value is outside the range when it is below the minimum or above the maximum. A value equal to a limit is within the range.
- [ ] An empty field is never outside the range.
- [ ] A variable-dose prescription has no dose amount, so only its dispensing quantity is checked.
- [ ] An automatically calculated dispensing quantity is checked the same way as one entered by hand.
- [ ] When prescribing on desktop, the dose amount and dispensing quantity are checked on a new prescription, when editing a prescription, and on each item of a medication set.
- [ ] When sending to pharmacy, the quantity and the prescription's dose amount on each item are checked.
- [ ] When discharging a patient, the dispensing quantity and the prescription's dose amount on each medication are checked.
- [ ] When dispensing, the quantity on each item is checked against the drug's dispensing quantity range, and the dose amount and quantity are checked when pharmacy modifies a prescription at dispense.

## Inline warning

- [ ] When a value is outside the range, a warning appears directly below the field.
- [ ] The warning updates as the value is typed, without waiting for the user to leave the field or save. It appears as soon as the value moves outside the range and clears as soon as it is back within the range or the field is emptied, e.g. changing a dose of 300 tablets to 2 against a maximum of 3 tablets clears the warning.
- [ ] The warning names the limit that was crossed and its value in the drug's unit, e.g. "Above max of 2 tablets" or "Below min of 1 tablet".
- [ ] The warning does not prevent saving. The form or table submits as normal with the value as entered.
- [ ] In the send to pharmacy, discharge, and dispense tables, the warning appears below the quantity input on that item's row.
- [ ] In the send to pharmacy and discharge tables, a dose amount outside the range shows its warning below the dose on that item's row: in the dose column when sending to pharmacy, and below the dose and frequency line under the medication name when discharging. The dose is not editable there, so the warning stays for as long as the modal is open.
- [ ] In a medication set, an item with a value outside the range shows the warning in the set's list of items as well as when the item is opened for editing.

## Overrides

- [ ] Saving with a value outside the range records an override, noting which value was outside the range and the limit it crossed.
- [ ] Any user who can save the prescription, pharmacy order, or dispense can save past the warning.
- [ ] An override made while prescribing, editing a prescription, or discharging is recorded against the prescription, one made while sending to pharmacy against the pharmacy order item, and one made while dispensing against the dispense.
- [ ] Saving past a dose warning in the send to pharmacy or discharge modals records no override, since the dose is not changed there. The dose's override, if any, is the one recorded when the prescription was saved.
- [ ] An override reflects the record's saved values: editing a prescription so its values are back within range clears its override.
- [ ] An override is fixed when saved. Changing a drug's limits later does not add or remove overrides on existing records.
- [ ] An override made while dispensing is held on the dispense record for audit and reporting.

## Pharmacy flags

- [ ] On the dispense screen, an item whose prescription or pharmacy order item carries an override shows a warning below the medication name, so pharmacy can check the order before dispensing.
- [ ] The warning uses the same wording as the inline warning, naming each limit that was crossed, e.g. "Above max of 2 tablets".
