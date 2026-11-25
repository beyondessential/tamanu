---
id: REASGN
---

# Reassigning an encounter

Applies to reassigning an encounter recorded against the wrong patient to the right one, from the actions menu on a patient's encounter history table, and to the encounter's data that moves with it.

## Actions menu

- The actions menu on each row of the patient's encounter history table offers Reassign encounter, listed directly below Delete.
- Reassign encounter is hidden from users without permission to reassign encounters.
- Reassign encounter is offered for any encounter in the history, whatever its type and whether or not it has been discharged.

## Confirmation modal

- Choosing Reassign encounter opens a modal titled Reassign encounter, laid out like the delete encounter modal.
- The modal shows the encounter's date, type, facility and reason for encounter, so the user can check they have chosen the right one.
- The modal warns that the encounter and all of its data, including notes, diagnoses and procedures, will be reassigned to another patient.
- The user enters the NHN of the patient the encounter currently belongs to, and the NHN of the patient it is being reassigned to. Both are required.
- Once the new patient NHN matches a patient record, the modal shows that patient's name, sex and date of birth beneath the field, so the user can confirm they have the right person before confirming.

> [!NOTE]
> Typing both NHNs is deliberate friction, as for deleting an encounter: reassigning puts clinical history in another person's record, and a mistake is as serious as the one it corrects.

### Validation

- Confirming with either NHN empty shows "*Required" against that field.
- A current patient NHN that does not match the patient whose history the user is on shows "NHN does not match patient record".
- A new patient NHN that matches no patient shows "NHN does not match a patient record".
- A new patient NHN that matches the current patient shows "Enter the NHN of a different patient".
- Nothing is reassigned until both NHNs are valid.

### Outcome

- Cancelling, closing the modal or pressing Escape leaves the encounter unchanged.
- Confirming reassigns the encounter, closes the modal, and removes the encounter from the current patient's encounter history.
- The encounter then appears in the new patient's encounter history, with its original dates, facility, clinicians and status.
- While the reassignment is in progress, the confirm button shows it is working and cannot be pressed again.
- If the reassignment fails, the user sees an error message, and the encounter stays with the current patient.

## What is reassigned

- Everything recorded within the encounter moves with it to the new patient: notes, diagnoses, procedures, medications, lab and imaging requests, vitals and charts, forms, documents, invoices, and any other record belonging to the encounter.
- Records that belong to the patient rather than the encounter, such as allergies, conditions and patient details, stay with their patient.
- An active encounter cannot be reassigned to a patient who already has an active encounter; the modal shows an error and nothing is reassigned.
- Reassigning an encounter requires permission to reassign encounters; the server rejects the request from any user without it.
- The reassignment is recorded in the encounter's change history with the user who made it, the patient it came from and the patient it went to.
- The reassignment reaches every facility and device holding either patient through sync, as any other change to the encounter does.
