# Re-wire discharge note draft option

## Background

Discharge drafts shipped in 2.26 (#7181) and were hidden three weeks later by #7267, cut against `release/2.26` and carried to main by the 2.26 merge (#7308, 6 March 2025).
The hide was never reverted. It is still in effect on main and on `release/2.62`.

#7267 made three changes that are all one feature, not three fixes:

1. Removed `onBack`/`backButtonText` from the discharge form's button row, hiding **Save & exit**.
2. Collapsed dirty-cancel to a plain `onCancel()`, making the unsaved-changes screen unreachable.
3. Stopped restoring the discharge note from the draft, so the field always seeds from live discharge planning notes.

Change 3 was fixing a real bug ("Discharge planning note not being populated"): a draft's note won over the live planning notes, so notes written during the admission went unseen.
It was only safe because change 1 meant nothing could create a draft any more.
Re-exposing the button without resolving the merge reintroduces that bug or loses the clinician's text, so all three have to be dealt with together.

### What is still wired

- Persistence: `encounters.discharge_draft` (JSONB, `Encounter.ts:111`), the `onSubmit({ dischargeDraft })` path (`DischargeForm.jsx:301`), and `DischargeModal`'s do-not-navigate-away branch (`DischargeModal.jsx:73-86`).
- Restore: `getDischargeInitialValues` and `getMedicationsInitialValues` still read the draft, and have kept pace with the medication rewrite (quantity, repeats, sendToPharmacy, pharmacy order clinician).

### What is dead code

- `showWarningScreen` / `setShowWarningScreen` state, still passed to `DischargeFormScreen` (`DischargeForm.jsx:249`, `:377`), which no longer destructures it.
- The `UnsavedChangesScreen` branch (`DischargeForm.jsx:401`) and the component itself (`DischargeFormScreens.jsx:240-275`), complete with its own Save & exit button and `discharge.modal.unsavedChanges.*` strings.
- `handleStepForward`'s `isSavedForm` branch, only ever called with `false`.

### Traps

- The note is the **only** draft field not restored today (`DischargeForm.jsx:166`), and the only one carrying real authoring effort. Everything else is a re-pickable dropdown or a number.
- Nothing anywhere clears `discharge_draft`. Neither `onDischarge` nor the update path nulls it, so a draft currently outlives the discharge it belongs to.
- The form has grown a lot since February 2025 (pharmacy orders, ongoing medications, stock column). Round-trip fidelity for the newer fields has never been exercised.

## Decisions

Product behaviour is specified in `specs/encounters/discharge-draft.md`.
The decisions that shaped it:

- **A draft is a scratch pad, not clinical record.** No notes-pane exposure, no export, no visibility as a note. It is one clinician's interrupted work.
- **The indicator is bare.** "Draft", with no saved-by or saved-at shown. A clinician coming back to their own work does not need provenance.
- **Author-scoped visibility forces author-scoped storage.** With a single blob per encounter, a second clinician would silently clobber a draft they were never allowed to see, which is worse than the shared-indicator case. So visibility and storage scope together.
- **The note merge keys off note identity, not a timestamp.** Ids sidestep notes edited after the fact, sync arrival order, and facility timezone skew. This also means no saved-at field is needed for the merge.

## Build steps

- [x] Replace `encounters.discharge_draft` with a draft per (encounter, clinician), schematised rather than a nested blob
  - [x] `encounter_discharge_drafts` and `encounter_discharge_draft_medications` tables, `DO_NOT_SYNC`, registered in `NON_SYNCING_TABLES`
  - [x] Migration drops the old column and flags the encounters sync lookup for rebuild
  - [x] dbt source models regenerated and documented
- [x] Re-expose **Save & exit** on the discharge form, gated on write-discharge permission
- [x] Restore the dirty-cancel route to the unsaved-changes screen, reviving `showWarningScreen`
- [x] Store the discharge note in the draft alongside the ids of the planning notes it was seeded from
- [x] Merge on resume: restore the clinician's text, append planning notes added since
- [x] Clear all drafts for an encounter on finalise; clear the clinician's own on discard
- [x] Add the draft indicator, using a dedicated endpoint rather than shipping draft contents into list payloads
- [x] Remove whatever dead code the rebuild does not reclaim

`GET`/`PUT`/`DELETE /encounter/:id/dischargeDraft` all scope to the requesting user, so the
visibility rule is enforced server-side rather than by the caller passing an owner.

## Review the whole workflow

The card is as much a verification job as a build one. The loop to exercise end to end:

- [ ] Save a part-filled discharge, leave, come back, confirm every field returns as left
- [ ] Round-trip the fields added since Feb 2025: pharmacy order ordering clinician, send-to-pharmacy per medication, ongoing medications, stock column
- [ ] Draft saved, colleague adds a discharge planning note, resume, confirm both the typed text and the new note are present
- [ ] Resume and finalise, confirm `discharges.note` holds what was on screen
- [ ] Finalise, confirm no draft survives on the encounter
- [ ] Second clinician on an encounter with someone else's draft, confirm they see a clean form and their save does not disturb it
- [ ] Draft on an encounter that is then discharged by someone else
- [ ] Discharge with no draft still behaves exactly as now

## Implementation notes

- Moving off the JSONB column needs a Sequelize migration, and per `packages/database/CLAUDE.md` the dbt source models under `database/model/` need regenerating and their TODOs filled.
- Existing `discharge_draft` values are almost certainly not worth carrying across: nothing has been able to write one since February 2025, so any surviving blob is at least that stale.
- Sync direction for the new table is an open question. Drafts are facility-local working state and have no clinical value centrally, but the default in this codebase is that models sync. Decide deliberately rather than by omission.
- Mobile has no `dischargeDraft` and no discharge form, so nothing is owed there.
- The indicator's placement (encounter view, encounter list, patient view) is undecided and worth a mockup before building.
