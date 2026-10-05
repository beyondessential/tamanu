---
id: DDRAFT
---

# Discharge draft

Discharging a patient is a long form: discharge date, discharging clinician, disposition, the medications the patient leaves with, and the treatment plan and follow-up notes.
A clinician interrupted part way through can save what they have entered and come back to it, instead of losing the work or holding the form open until they can finish.

A draft is working state rather than clinical record.
It holds what one clinician has entered so far, and the discharge is recorded only when the form is finalised.

## Saving and resuming

The discharge form offers "Save & exit" alongside finalising the discharge.
Saving stores the form as it stands and closes it without discharging the patient, so the encounter stays open and the clinician stays on it rather than being returned to the patient view.

Saving a draft requires permission to write discharges.

Reopening the discharge form restores what the draft holds: the discharge date, the discharging clinician, the disposition, the ordering clinician for the pharmacy order, and for each medication its quantity, repeats, and whether it is being sent to pharmacy.
The treatment plan and follow-up notes are restored as described below.

## Whose draft it is

Each clinician has their own draft on an encounter and sees only their own.
A draft is the private working state of whoever saved it, so one clinician saving cannot discard another clinician's part-finished work.

An encounter that the clinician has a draft on shows an indicator that the draft is there.
The indicator says only that a draft exists.
Someone returning to their own interrupted work needs to know it is waiting, not who saved it or when.

## Treatment plan and follow-up notes

The treatment plan and follow-up notes field is seeded from the encounter's discharge planning notes, oldest first, so the discharging clinician starts from what was recorded during the admission and edits from there.

A draft records both the text as the clinician left it and which planning notes that text was seeded from.
Resuming restores the clinician's own text, then appends any discharge planning notes written since the draft was saved.
The clinician's own wording is usually the most substantial thing in a draft and has no other home until the discharge is finalised, while planning notes a colleague added afterwards still need to reach the discharge.

A draft identifies the planning notes it has already absorbed by which notes they are, rather than by when the draft was saved.
This keeps the merge correct when a planning note is edited after it was written, or arrives out of order through synchronisation.

## Leaving the form

Closing a discharge form that has unsaved changes asks the clinician whether to save and exit, discard the changes, or return to the form.
A form with no changes closes without asking.

Discarding clears the clinician's draft on that encounter.
The form is seeded from the draft when one exists, so the content being discarded is the draft itself.

## Clearing

Finalising a discharge clears every draft on that encounter, including drafts saved by other clinicians, because the discharge has happened and no draft of it is live any longer.
