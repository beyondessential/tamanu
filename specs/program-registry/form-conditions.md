---
id: PRFC
---

# Related conditions from forms

A `ProgramRegistryCondition` form question records a related condition, with its category, on the patient's registration in the registry that belongs to the form's program. It works on desktop and mobile, and a form can hold several of these questions to record more than one condition.

## Answering the question

- [ ] The question lists the current conditions of the form's program registry
- [ ] Conditions the patient already has on that registration are left out, except ones that are deleted or have the category Recorded in error
- [ ] A condition chosen in another condition question on the same form is left out
- [ ] Once a condition is chosen, a Category field appears and is required; it lists the registry's categories
- [ ] When the patient has no active registration in the registry, the question shows that the patient is not registered and cannot be answered, unless the form itself writes registration fields back to the patient; when the patient has an inactive or recorded-in-error registration, the form must write the registration status

## Mandatory condition

- [ ] When the registry has `mandatoryConditionEnabled`, the form needs at least one condition across its condition questions; the required message shows on the first visible condition question
- [ ] The requirement does not apply when the patient already has a current condition on the registration, or when no condition question can be answered

## Saving

- [ ] Submitting adds each answered condition to the patient's active registration, dated with the submission time and recorded by the submitting user
- [ ] Registration fields written back by the same form are saved first, so a form can register a patient and record a condition in one submission
- [ ] A condition the patient already has (other than deleted or recorded in error) is not added again
- [ ] With no active registration at save time, no condition is recorded and the submission still succeeds
- [ ] Editing a response never adds, changes or removes related conditions; condition questions are read-only, with a note to make changes in the program registry
- [ ] The mandatory condition requirement does not apply when editing a response

## Viewing a response

- [ ] A response shows the condition and category names for each answered condition question
