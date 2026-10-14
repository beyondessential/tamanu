---
id: SYND
---

# Syndromic surveillance

Syndromic surveillance tracks which symptoms a practitioner observes a patient presenting with, independent of formal diagnosis, so a deployment can watch for patterns across its patient population. Each deployment designs what is captured as a program form, and a practitioner completes that form once for an encounter, from the encounter's diagnosis pane or from the discharge form.

## The syndromic surveillance form

The syndromic surveillance form is the program form with the code `syndromicsurveillance` in the program with the code `syndromicsurveillance`. These two codes are what identify it. A deployment sets up the program and the form through the standard program import, and decides which questions the form asks.

The program is an ordinary program. It can hold other forms alongside the syndromic surveillance form and can have a program registry, and these behave as they would in any other program.

The form is an ordinary program form. It supports every question type and configuration that program forms support, and it is displayed the same way as any other program form. Its responses are listed under Forms at both patient and encounter level, where they can be viewed and edited like any other form's responses.

Unlike other forms, it is completed only from the diagnosis pane or the discharge form. Wherever users choose a form to complete from its program, such as Forms at patient or encounter level or a program registry, it is left out of the forms on offer, and so is its program when it holds no other form to complete. Submitting a response to it any other way is rejected.

Syndromic surveillance is available in a deployment while its syndromic surveillance form is current and not marked obsolete. While it is available, the encounter's diagnosis pane and the discharge form each show a syndromic surveillance section.

## Completion

An encounter has at most one response to the syndromic surveillance form. Its syndromic surveillance is complete once it has that response, and not yet completed until then. Submitting a response for an encounter that already has one is rejected, so the response is revised by editing it, from the diagnosis pane or from Forms.

Deleting the response from Forms returns the encounter's syndromic surveillance to not yet completed.

## Diagnosis pane

While syndromic surveillance has not been completed, the diagnosis pane shows a "Syndromic surveillance" action. It opens a modal containing the syndromic surveillance form, and submitting the form there records the response against the encounter. Once the encounter has ended the action is disabled, as no form takes a new response against an ended encounter.

Once it is complete, the pane shows "Syndromic surveillance: Complete" with a completion icon to its left, alongside a "View/Edit" action that opens the encounter's response in the modal. For a user who cannot edit the response, the action reads "View" and the response opens read-only.

## Discharge form

While syndromic surveillance has not been completed, the discharge form's syndromic surveillance section embeds the syndromic surveillance form, displayed the same way as a form embedded in the procedure modal. Submitting it works the same way as submitting a form from within a procedure: the response is recorded against the encounter as soon as it is submitted, separately from finalising the discharge, and the section then shows syndromic surveillance as complete.

Answers entered into the embedded form but not yet submitted are discarded without a warning when the clinician cancels out of the discharge form.

Finalising the discharge while the embedded form has answers that have not been submitted warns the clinician that the syndromic surveillance answers will be lost. They can return to the form to submit it, or finalise the discharge without it, which discards those answers. When the deployment requires syndromic surveillance at discharge, the discharge cannot be finalised without it, so the section is flagged as required instead.

Once syndromic surveillance is complete, the section shows only that it is complete.

A deployment can require syndromic surveillance to be completed at discharge. When it does, the discharge form cannot be finalised until syndromic surveillance for the encounter is complete, and attempting to finalise it flags the syndromic surveillance section as required. The requirement applies while syndromic surveillance is available, and only to discharges made through the discharge form; an encounter that is discharged automatically, such as an outpatient encounter, is discharged regardless.

## Permissions

The diagnosis pane's syndromic surveillance section follows the standard permissions for program forms, applied to the syndromic surveillance form:

- Seeing the section and viewing a response requires permission to read the form.
- Submitting a response requires permission to submit the form and to create form responses. A user who can read the form but not submit it sees the "Syndromic surveillance" action disabled.
- Editing a response requires permission to write the form. Without it, the response opens read-only.

The discharge form's syndromic surveillance section, including completing the form there, is covered by the permissions to discharge the encounter, which are write on encounters and write on discharges. It needs none of the form's permissions.

The section is shown only to users who hold both. Opening the discharge form takes only write on encounters, so a user without write on discharges, who could no more submit the form than finalise the discharge, sees the discharge form without the section.
