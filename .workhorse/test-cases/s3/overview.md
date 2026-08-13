# Re-wire discharge note draft option

Coverage for saving a part-completed discharge, coming back to it, and finalising. The draft
machinery shipped in 2.26 and has been unreachable since February 2025, so most of this is
first-time coverage rather than regression protection.

## Saving and resuming

- [x] Saving a draft stores it and reads back unchanged (verifies spec: DDRAFT)
- [x] Saving twice replaces the draft rather than accumulating one per save
- [ ] Save & exit closes the modal and leaves the encounter open, without navigating to the patient view
- [ ] Reopening the form restores discharge date, discharging clinician, and disposition
- [x] Reopening restores each medication's quantity, repeats, and send-to-pharmacy (verifies spec: DDRAFT)
- [x] A prescription dropped from the form does not survive the next save
- [ ] Reopening restores the pharmacy order's ordering clinician
- [ ] An untouched form still opens with live defaults when no draft exists
- [x] Saving a draft on an already-discharged encounter is refused
- [x] A user without permission to write discharges cannot save a draft
- [x] A draft request for an encounter that does not exist 404s

## The discharge note

- [x] Without a draft the note seeds from the encounter's discharge planning notes, oldest first (verifies spec: DDRAFT)
- [x] Resuming restores the clinician's own text rather than reseeding from the notes (verifies spec: DDRAFT)
- [x] A planning note added after the draft was saved is appended on resume (verifies spec: DDRAFT)
- [x] A planning note edited after being absorbed is not appended a second time (verifies spec: DDRAFT)
- [x] A new planning note still appears when the clinician had cleared the note field
- [ ] Finalising after a resume writes what is on screen to the discharge record

## Whose draft it is

- [x] One clinician does not see another clinician's draft (verifies spec: DDRAFT)
- [x] One clinician saving does not overwrite another's draft (verifies spec: DDRAFT)
- [x] Discarding clears only the requesting clinician's own draft (verifies spec: DDRAFT)
- [ ] The draft indicator appears only for a clinician who has their own draft on the encounter
- [ ] The indicator does not appear on a discharged encounter

## Leaving the form

- [ ] Closing a form with unsaved changes offers save and exit, discard, or return to the form
- [ ] Closing a form with no changes closes without asking
- [ ] Returning to the form from the unsaved-changes screen keeps the entered values
- [ ] Discarding clears the draft and closes the modal

## Clearing

- [x] Finalising a discharge clears every draft on the encounter, including other clinicians' (verifies spec: DDRAFT)
- [ ] Deleting an encounter takes its drafts with it

## Fields added since drafts last worked

The form has grown considerably since February 2025, and none of this was ever exercised against a
draft.

- [ ] Ongoing medications listed alongside encounter medications round-trip through a draft
- [ ] The stock column still resolves correctly on a resumed draft
- [ ] The already-ordered confirmation still fires correctly when finalising a resumed draft

## Operational

- [ ] The migration applies to a database with existing encounters carrying legacy draft blobs
- [ ] Drafts do not appear in sync payloads
