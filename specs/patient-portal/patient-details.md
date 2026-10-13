---
id: PPDET
---

# Patient portal patient details

Your details, opened from the dashboard (see `patient-portal/overview.md`), shows the signed-in patient's demographic and contact details and lets the patient keep their own contact, address, emergency contact, insurance and selected personal details up to date. Each group of details is edited on its own short screen, so the form and its Save fit on a phone.

## Displayed details

- [ ] The details are grouped under headings, each on its own panel:
  - Personal: Patient ID, Title, First name, Middle name, Last name, Date of birth, Sex, Village and Ethnicity
  - Contact: Mobile phone, Other phone, Email
  - Address: Street address, Town or city
  - Emergency contact: Name, Phone
  - Insurance: Health insurer, Policy number
  - Other: Occupation
- [ ] Each detail shows its label above its value. A detail with no value shows "Not recorded".
- [ ] A field the deployment has configured as hidden in its patient field settings does not appear, on the details page or its edit screen. A group whose details are all hidden does not appear.
- [ ] Field labels use the deployment's translations, so a field the deployment has renamed shows its renamed label.

## Editing

- [ ] Each group with a detail the patient can change has an Edit button beside its heading, which opens that group's edit screen.
- [ ] The edit screen shows only the group's details the patient can change, each as an input prefilled with its current value. The identifying details (Patient ID, names, date of birth, sex and village) are never editable; the Personal edit screen says to talk to the clinic to change them.
- [ ] Title is chosen from the standard list of titles.
- [ ] Ethnicity, Health insurer and Occupation are chosen from the deployment's current reference data for that type. A patient's existing choice that has since been retired still shows as chosen, and can be changed or set to None.
- [ ] Every chosen detail can be set to None, and every typed detail can be cleared, removing its value from the patient record.
- [ ] Phone and email inputs bring up the phone's matching keyboard, and inputs offer the browser's saved contact and address details.
- [ ] Save and Cancel sit in a bar fixed to the bottom of the screen, so they are in view however long the form is.
- [ ] Cancel, or the back link, returns to the details page at the group that was being edited.
- [ ] Leaving the edit screen with unsaved changes, by Cancel, the back link, the header or the browser's back button, shows a "Discard changes?" prompt with Keep editing and Discard. Discard drops the edits and carries on; Keep editing, Escape, or tapping outside the prompt leaves the form open with the edits intact.
- [ ] Closing or reloading the browser tab with unsaved changes triggers the browser's standard leave-page warning.
- [ ] Editing Email changes the email on the patient record only; the email the patient uses to sign in to the portal is unaffected.

## Validation

- [ ] A field the deployment has configured as required is marked as required, and the group can't be saved while it is blank, including when it was already blank before editing.
- [ ] Email must be a valid email address.
- [ ] Mobile phone, Other phone and emergency contact Phone accept only digits, spaces, a leading plus sign, hyphens and brackets.
- [ ] Formats are checked only on details the patient changed, so a value recorded by staff in another format doesn't stop the patient saving the rest of the group.
- [ ] A field that fails validation is outlined and shows a message beneath it when the patient taps Save, and nothing is saved until it is corrected.
- [ ] The same rules are enforced by the server, which also refuses changes to hidden fields, to any detail outside the editable list, and reference data that isn't current or of the right type.

## Saving

- [ ] Saving updates the patient record immediately, without staff review.
- [ ] Only the details the patient changed are written, so a change made by staff to another detail in the meantime is preserved.
- [ ] Saving with nothing changed returns to the details page without writing anything.
- [ ] A successful save returns to the details page at the saved group, showing the saved values, with a "Details saved" message at the top of the screen.
- [ ] The "Details saved" message disappears on its own after 3 seconds, and the patient can also dismiss it sooner with its close button.
- [ ] If the save fails, the edit screen stays open with the patient's edits intact and an error message is shown.
- [ ] Changes made through the portal reach facility servers through the normal sync process and appear on the patient's record in Tamanu like any other update.
- [ ] A patient can only edit their own record.
