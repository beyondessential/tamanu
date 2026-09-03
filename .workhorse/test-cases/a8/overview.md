# Re-hide the discharge draft workflow

The discharge draft workflow is built and left in place, with every clinician-facing entry point
gated behind `IS_DISCHARGE_DRAFT_ENABLED` in `packages/web/app/forms/dischargeDraft.js`.

These cases split into two halves: the entry points are gone, and the ordinary discharge the
clinician still relies on is untouched. The second half carries the risk, because the draft query
used to gate the form's loading and the discharge form is the main path through this screen.

## Entry points are hidden

- [ ] An encounter shows no "Draft" tag on its action row, including one that already has a saved
      draft row in the database. Verifies spec: DDRAFT
- [ ] The discharge form offers no "Save & exit" button alongside "Finalise discharge".
      Verifies spec: DDRAFT
- [ ] Closing a discharge form that has been edited closes it straight away, with no
      unsaved-changes prompt offering to save or discard. Verifies spec: DDRAFT
- [ ] Reopening the discharge form for a clinician who has a saved draft row seeds the form from
      live encounter data, not from the draft. Verifies spec: DDRAFT
- [ ] No request is made to the discharge draft endpoint while the encounter or discharge form is
      open.

## Ordinary discharge is unaffected

- [x] The discharge form opens rather than sitting on its loading indicator, now that the draft
      query no longer gates the form's initial data. Covered by `patientDischarge.spec.ts`
- [x] A patient can be discharged end to end: medications, pharmacy order, and treatment plan
      notes all behave as before. Covered by `patientDischarge.spec.ts`
- [x] The treatment plan field is still seeded from the encounter's discharge planning notes,
      oldest first. Covered by `patientDischarge.spec.ts`
- [ ] A discharge form whose planning notes fail to load still blocks finalising, with the
      existing tooltip.

## The work is recoverable

- [ ] Flipping `IS_DISCHARGE_DRAFT_ENABLED` to true and un-skipping
      `dischargeDraft.spec.ts` restores the workflow with its original coverage passing.
