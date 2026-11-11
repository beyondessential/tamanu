---
id: DQLIM
---

# Dose and dispensing quantity limits

Applies to the accepted range a drug can carry for its dose amount and for its dispensing quantity, how those ranges are configured on Drug reference data, and the warning shown on desktop when a value entered while prescribing, sending to pharmacy, discharging or dispensing falls outside them.

## Configuring limits

- Each drug has four optional limits: a minimum and maximum dose, and a minimum and maximum dispensing quantity.
- Dose limits are in the drug's dosing unit, and dispensing quantity limits are in its dispensing unit.
- Each limit is independent, so a drug can carry any combination of them, and a drug with no limits never shows a warning.
- Limits are set per drug and apply at every facility.
- Limits are set on the Drug reference data, either through the import spreadsheet or on the drug's record in the admin panel's reference data management.
- The Drug tab of the import spreadsheet holds the limits in the columns `doseMin`, `doseMax`, `dispensingQuantityMin` and `dispensingQuantityMax`, and a blank cell leaves that limit unset.
- Exporting drugs includes the four limit columns, with a blank cell for each unset limit.
- A limit is invalid when it is negative, when it is a dispensing quantity limit that is not a whole number, or when it is a minimum greater than its matching maximum.
- The importer rejects a Drug row holding an invalid limit, and saving a drug in reference data management rejects it the same way.

> [!NOTE]
> Each limit is its own column so that a drug can carry a minimum or a maximum on its own, and so that each limit reads and edits as a plain number in both the spreadsheet and the admin panel.

## Out-of-range values

- A value is out of range when it is below its minimum or above its maximum; a value equal to a limit is in range.
- An empty field is never out of range.
- A variable-dose prescription has no dose amount, so only its dispensing quantity is checked.
- A dispensing quantity calculated automatically is checked the same way as one entered by hand.
- When pharmacy substitutes a different drug at dispense, the substituted drug's limits apply.

## The inline warning

- When a value is out of range, a warning appears directly below it.
- A value that is already out of range when a form or table opens, such as a quantity carried over from the prescription, shows its warning straight away.
- The warning is a single line of small text led by an orange warning icon, and the field keeps its normal appearance rather than showing as an error.
- The warning updates as the user types: it appears as soon as the value goes out of range, and clears once the value is back in range or the field is empty.
- The warning names the limit crossed and its value in the drug's unit, for example "Above expected max of 2 tablets" or "Below expected min of 1 tablet".
- The warning does not stop the user saving, and the value is saved as entered.

> [!NOTE]
> The limits exist to catch dosing-unit mix-ups, such as 500 tablets prescribed for 500 mg, before the quantity carries through to dispensing and the invoice. A dose outside the usual range is sometimes clinically right, so the warning asks for a second look rather than blocking the save.

## Prescribing

- The prescription form is checked for a new prescription on an encounter and for an ongoing medication added at the patient level.
- A dose warning appears below the "Dose amount" field, and a quantity warning below the "Dispensing quantity" field.

### Medication sets

- The importer rejects a Medication Template row whose dose amount is outside its drug's dose range, so a medication set cannot be imported with a medication whose dose is out of range.
- Saving a medication template in reference data management rejects a dose amount outside its drug's dose range the same way.
- A template's discharge quantity is imported as entered, without being checked against the drug's dispensing quantity range.
- Each item of a medication set is checked in the prescription form when it is opened for editing, with its warnings shown the same as on a single prescription.

### Adding ongoing medications to an encounter

- In the "Add ongoing medications" modal, each medication's quantity is checked, and its warning appears below the input in the "Discharge qty" column of that medication's row.
- Each medication's dose amount is checked, and its warning appears below the dose in the "Dose" column.
- A medication's warnings show whether or not it is selected.
- The dose cannot be edited in this modal, so a dose warning stays on screen while the modal is open.

## Sending to pharmacy

- Each item's quantity is checked, and its warning appears below the input in the "Quantity" column of that item's row.
- Each item's dose amount is checked, and its warning appears below the dose in the "Dose" column.
- An item's warnings show whether or not the item is selected.
- The dose cannot be edited when sending to pharmacy, so a dose warning stays on screen while the modal is open.

## Discharging

- Each medication's dispensing quantity is checked, and its warning appears below the input in the "Dispensing qty" column of that medication's row.
- Each medication's dose amount is checked, and its warning appears below the dose and frequency line under the medication name.
- A medication's warnings show whether or not it is being sent to pharmacy.
- The dose cannot be edited on the discharge form, so a dose warning stays on screen while the form is open.

## Dispensing

- Each item's quantity is checked against its drug's dispensing quantity range, and its warning appears below the input in the "Quantity" column of that item's row.
- In the dispense list, only the quantity is checked.
- When pharmacy modifies a prescription at dispense, the dose amount and dispensing quantity are checked in the "Modify prescription" form, with each warning below its field.
- When a recorded dispense is edited in "Edit dispensed medication", its quantity is checked, and its warning appears below the input in the "Quantity" column.
