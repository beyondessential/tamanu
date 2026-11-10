---
id: SYND
---

# Syndromic surveillance

Applies to syndromic surveillance: the program form a practitioner completes once for an encounter, from its diagnosis pane or its discharge form, to record the symptoms a patient presents with independent of formal diagnosis.

## The syndromic surveillance form

- The syndromic surveillance form is the program form with the code `syndromicsurveillance` in the program with the code `syndromicsurveillance`. These two codes are what identify it.
- A deployment sets up the program and the form through the standard program import, and decides which questions the form asks.
- The program is an ordinary program. It can hold other forms alongside the syndromic surveillance form and can have a program registry, and these behave as they would in any other program.
- The form supports every question type and configuration that program forms support, and is displayed the same way as any other program form.
- Its responses are listed under Forms at both patient and encounter level, where they can be viewed and edited like any other form's responses.
- The form is completed only from the diagnosis pane or the discharge form. Wherever users choose a form to complete from its program — Forms at patient or encounter level and program registries on desktop, and Programs on mobile — it is left out of the forms on offer, and so is its program when it holds no other form to complete.
- Submitting a response to it any other way is rejected.
- Syndromic surveillance is available in a deployment while its syndromic surveillance form is current and not marked obsolete. While it is available, the encounter's diagnosis pane and the discharge form each show a syndromic surveillance section.

> [!NOTE]
> Syndromic surveillance lets a deployment watch for patterns in the symptoms seen across its patient population, which is why each deployment designs the form itself. The form is kept to the diagnosis pane and the discharge form because those are what hold an encounter to a single response.

## Completion

- An encounter has at most one response to the syndromic surveillance form.
- An encounter's syndromic surveillance is complete once it has that response, and not yet completed until then.
- Submitting a response for an encounter that already has one is rejected, so the response is revised by editing it, from the diagnosis pane or from Forms.
- Deleting the response from Forms returns the encounter's syndromic surveillance to not yet completed.

## Diagnosis pane

- While syndromic surveillance has not been completed, the diagnosis pane shows a "Syndromic surveillance" action.
- The action opens a modal holding the syndromic surveillance form, displayed the same way as a form embedded in the procedure modal. Submitting the form there records the response against the encounter.
- The form's last screen in the modal reads "Form complete", and offers Cancel alongside Prev and Complete.
- Once the encounter has ended, the action is disabled.
- Once syndromic surveillance is complete, the pane shows "Syndromic surveillance: Completed" with a completion icon to its left, alongside a "View/Edit" action that opens the encounter's response in the modal.
- For a user who cannot edit the response, the action reads "View" and the response opens read-only.

> [!NOTE]
> The action is disabled on an ended encounter because no form takes a new response against one.

## Discharge form

- The discharge form's syndromic surveillance section shows its title and a prompt to complete syndromic surveillance, both before and after it is complete.
- While syndromic surveillance has not been completed, the section embeds the syndromic surveillance form, displayed the same way as a form embedded in the procedure modal. A long form scrolls within its box, so the discharge form keeps its size.
- Submitting the embedded form works the same way as submitting a form from within a procedure: the response is recorded against the encounter as soon as it is submitted, separately from finalising the discharge.
- Once syndromic surveillance is complete, the section shows that it is complete in place of the form.
- Answers entered into the embedded form but not yet submitted are discarded without a warning when the clinician cancels out of the discharge form.
- Finalising the discharge while the embedded form has answers that have not been submitted warns the clinician that the syndromic surveillance answers will be lost. They can return to the form to submit it, or finalise the discharge without it, which discards those answers.

### Required at discharge

- A deployment can require syndromic surveillance to be completed at discharge.
- When it does, the section's title is marked as required, both before and after syndromic surveillance is complete.
- The discharge form then cannot be finalised until syndromic surveillance for the encounter is complete. Attempting to finalise it flags the section as required, with a required message beneath the form, in place of the warning about unsubmitted answers.
- The requirement applies while syndromic surveillance is available, and only to discharges made through the discharge form. An encounter that is discharged automatically, such as an outpatient encounter, is discharged regardless.

## Permissions

- The diagnosis pane's syndromic surveillance section follows the standard permissions for program forms, applied to the syndromic surveillance form.
- Seeing the section and viewing a response requires permission to read the form.
- Submitting a response requires permission to submit the form and to create form responses. A user who can read the form but not submit it sees the "Syndromic surveillance" action disabled.
- Editing a response requires permission to write the form. Without it, the response opens read-only.
- The discharge form's syndromic surveillance section, including completing the form there, is covered by the permissions to discharge the encounter, which are write on encounters and write on discharges, and needs none of the form's permissions.
- The discharge form's section is shown only to users who hold both permissions to discharge.

> [!NOTE]
> Opening the discharge form takes only write on encounters. A user without write on discharges could no more submit the form than finalise the discharge, so they see the discharge form without the section.
