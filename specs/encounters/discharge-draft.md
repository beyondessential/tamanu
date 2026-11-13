---
id: DDRAFT
---

# Discharge draft

Applies to the draft a clinician saves part way through the discharge form — the discharge date, discharging clinician, disposition, the medications the patient leaves with, and the treatment plan and follow-up notes — and to resuming it.

## Availability

- A draft is working state rather than clinical record: it holds what one clinician has entered so far, and the discharge is recorded only when the form is finalised.
- This workflow is not available to clinicians.
- Every entry point to it is hidden: saving a draft, the draft indicator on an encounter, the prompt on leaving a form with unsaved changes, and restoring a saved draft into the form.
- No draft is written while it is hidden.

> [!NOTE]
> It is hidden pending Product design on how edits to the discharge planning note are tracked. The rest of this spec describes the workflow that is built and waiting behind that decision.

## Saving and resuming

- The discharge form offers "Save & exit" alongside finalising the discharge.
- Saving stores the form as it stands and closes it without discharging the patient, so the encounter stays open and the clinician stays on it rather than being returned to the patient view.
- Saving a draft requires permission to write discharges.
- Reopening the discharge form restores what the draft holds: the discharge date, the discharging clinician, the disposition, the ordering clinician for the pharmacy order, and for each medication its quantity, repeats, and whether it is being sent to pharmacy.
- The [treatment plan and follow-up notes](#treatment-plan-and-follow-up-notes) are restored by their own rules.

> [!NOTE]
> Saving lets a clinician interrupted part way through come back to the form, instead of losing the work or holding it open until they can finish.

## Whose draft it is

- Each clinician has their own draft on an encounter and sees only their own.
- An encounter that the clinician has a draft on shows an indicator that the draft is there.
- The indicator says only that a draft exists.

> [!NOTE]
> A draft is the private working state of whoever saved it, so one clinician saving cannot discard another clinician's part-finished work. Someone returning to their own interrupted work needs to know it is waiting, not who saved it or when.

## Treatment plan and follow-up notes

- The treatment plan and follow-up notes field is seeded from the encounter's discharge planning notes, oldest first.
- A draft records both the text as the clinician left it and which planning notes that text was seeded from.
- Resuming restores the clinician's own text, then appends any discharge planning notes written since the draft was saved.
- A draft identifies the planning notes it has already absorbed by which notes they are, rather than by when the draft was saved.

> [!NOTE]
> Seeding from the planning notes lets the discharging clinician start from what was recorded during the admission and edit from there. The clinician's own wording is usually the most substantial thing in a draft and has no other home until the discharge is finalised, while planning notes a colleague added afterwards still need to reach the discharge.
>
> Identifying the absorbed notes by which notes they are keeps the merge correct when a planning note is edited after it was written, or arrives out of order through synchronisation.

## Leaving the form

- Closing a discharge form that has unsaved changes asks the clinician whether to save and exit, discard the changes, or return to the form.
- A form with no changes closes without asking.
- Discarding clears the clinician's draft on that encounter.

> [!NOTE]
> The form is seeded from the draft when one exists, so the content being discarded is the draft itself.

## Clearing

- Finalising a discharge clears every draft on that encounter, including drafts saved by other clinicians.

> [!NOTE]
> The discharge has happened by then, so no draft of it is live any longer.
