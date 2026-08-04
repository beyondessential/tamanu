---
id: VITALS
---

# Vitals

Vitals and clinical observation charting. Clinicians record observations against an encounter as answers on a vitals or chart survey; recorded values can be corrected after the fact, and every correction is accountable: who changed it, when, from what to what, and why.

## Editing recorded values

- [ ] A recorded vitals or chart value can be edited. The reason for the change is chosen from a configured list of edit reasons, and whether giving one is mandatory is configurable.
- [ ] An edit updates the answer in place. The change is recorded as a changelog entry (see `specs/audit/changelog.md`) credited to the editing user, and the chosen reason travels as that entry's reason.
- [ ] Editing a value that feeds a calculated answer (e.g. BMI from height and weight) recalculates the dependent answer, and the recalculation is recorded the same way.
- [ ] Vitals recorded on mobile synchronise to the facility server and are edited there; mobile records new observations only.

## Edit history

- [ ] Each recorded value offers its history: every edit with the date, the user who made it, the reason given, and the value before and after.
- [ ] History is reconstructed from the answer's changelog entries. Consecutive entries supply each edit's before and after values, and the answer's insert entry supplies the original recording.
- [ ] History that predates the changelog appears in the same view carrying its original editor, time, reason, and values.
  - [ ] Entries imported from earlier history storage carry the original change's provenance, and read as operational entries, so history views that exclude migration entries still show them.
