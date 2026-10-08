---
id: SYND
---

# Syndromic surveillance

Syndromic surveillance tracks which symptoms a practitioner observes a patient presenting with, independent of formal diagnosis, so a deployment can watch for patterns across its patient population. Each deployment designs what is captured as a program form, and a practitioner completes that form for an encounter from the encounter's diagnosis pane, from the discharge form, or from Forms like any other program form.

## The syndromic surveillance form

The syndromic surveillance form is the program form with the code `syndromicsurveillance` in the program with the code `syndromicsurveillance`. These two codes are what identify it. A deployment sets up the program and the form through the standard program import, and decides which questions the form asks.

The program is an ordinary program. It can hold other forms alongside the syndromic surveillance form and can have a program registry, and these behave as they would in any other program.

The form is an ordinary program form. It supports every question type and configuration that program forms support, and it is displayed the same way as any other program form. It is listed under Forms at both patient and encounter level, where it can be completed, viewed and edited like any other form.

Syndromic surveillance is available in a deployment while its syndromic surveillance form is current and not marked obsolete. While it is available, the encounter's diagnosis pane and the discharge form each show a syndromic surveillance section.

## Completion

An encounter's syndromic surveillance is either not yet completed or complete. It is complete once the encounter has a response to the syndromic surveillance form, whichever way that response was submitted: from the diagnosis pane, from the discharge form, or from Forms at patient or encounter level. A response submitted from Forms at patient level counts for the encounter it is recorded against.

When an encounter has more than one response to the syndromic surveillance form, the most recent one is the response viewed and edited from the diagnosis pane.

## Diagnosis pane

While syndromic surveillance has not been completed, the diagnosis pane shows a "Syndromic surveillance" action. It opens a modal containing the syndromic surveillance form, and submitting the form there records the response against the encounter.

Once it is complete, the pane shows "Syndromic surveillance: Complete" with a completion icon to its left, alongside a "View/Edit" action that opens the encounter's response in the modal. For a user who cannot edit the response, the action reads "View" and the response opens read-only.

## Discharge form

While syndromic surveillance has not been completed, the discharge form's syndromic surveillance section embeds the syndromic surveillance form, displayed the same way as a form embedded in the procedure modal. Submitting it works the same way as submitting a form from within a procedure: the response is recorded against the encounter as soon as it is submitted, separately from finalising the discharge, and the section then shows syndromic surveillance as complete.

Answers entered into the embedded form but not yet submitted are discarded without a warning when the clinician cancels out of the discharge form.

Once syndromic surveillance is complete, the section shows only that it is complete.

A deployment can require syndromic surveillance to be completed at discharge. When it does, the discharge form cannot be finalised until syndromic surveillance for the encounter is complete, and attempting to finalise it flags the syndromic surveillance section as required. The requirement applies while syndromic surveillance is available, and only to discharges made through the discharge form; an encounter that is discharged automatically, such as an outpatient encounter, is discharged regardless.

## Permissions

The diagnosis pane's syndromic surveillance section follows the standard permissions for program forms, applied to the syndromic surveillance form:

- Seeing the section and viewing a response requires permission to read the form.
- Submitting a response requires permission to submit the form. A user who can read the form but not submit it sees the "Syndromic surveillance" action disabled.
- Editing a response requires permission to write the form. Without it, the response opens read-only.

The discharge form's syndromic surveillance section, including completing the form there, is covered by the permissions to discharge the encounter, which are write on encounters and write on discharges. It needs none of the form's permissions.
