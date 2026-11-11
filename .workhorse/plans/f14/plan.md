# Plan

## Design notes

### Patient details from the IPS modal

The IPS modal's "patient's details" link opens a patient details modal over the IPS modal, rather than closing it and navigating to the patient's Details tab. A saved change to the date of birth then shows in the IPS modal's date of birth box straight away, so the user can check it and carry on sending or downloading.

The modal is the one #W11 adds for invoicing: the Details tab's sections, fields and validation in a modal, with Cancel and Save, a discard confirmation for unsaved edits, and a read-only form with a single Close button for users who cannot edit patient records. It shows the Details tab as it stands on the default branch, so it carries no Billing information section. Building this means reusing that modal once W11 lands, or landing it here first, so the two cards are sequenced together.

The IPS form's patient email is set when the IPS modal opens. Saving a new email address in the patient details modal does not change the address already in the IPS form.
