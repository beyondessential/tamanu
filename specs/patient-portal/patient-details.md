---
id: PPDET
---

# Patient portal patient details

The Patient details section of the patient portal dashboard shows the signed-in patient's demographic and contact details, and lets the patient keep their own contact, address, emergency contact, insurance and selected personal details up to date.

## Displayed details

- [ ] The section opens with the patient's personal details: Patient ID, Title, First name, Middle name, Last name, Date of birth, Sex, Village and Ethnicity
- [ ] The remaining details follow, grouped under headings:
  - Contact: Mobile phone, Other phone, Email
  - Address: Street address, Town or city
  - Emergency contact: Name, Phone
  - Insurance: Health insurer, Policy number
  - Other: Occupation
- [ ] A detail with no value shows a dash
- [ ] A field the deployment has configured as hidden in its patient field settings does not appear in the section, in view or edit mode
- [ ] Field labels use the deployment's translations, so a field the deployment has renamed shows its renamed label

## Editing

- [ ] The section has an Edit action that switches the whole section into an edit form with Save and Cancel actions
- [ ] In edit mode, the identifying details (Patient ID, First name, Middle name, Last name, Date of birth, Sex, Village) remain visible and read-only
- [ ] In edit mode, every patient-editable detail is an input prefilled with its current value
- [ ] Title is chosen from the standard list of titles
- [ ] Ethnicity, Health insurer and Occupation are chosen from the deployment's active reference data for that type
- [ ] All other editable details are free-text inputs
- [ ] Cancel discards any unsaved edits and returns the section to view mode
- [ ] Collapsing the section or leaving the page with unsaved edits asks the patient to confirm discarding them; declining keeps the form open with the edits intact
- [ ] Editing Email changes the email on the patient record only; the email the patient uses to sign in to the portal is unaffected

## Validation

- [ ] A field the deployment has configured as required is marked as required and cannot be saved blank
- [ ] Any other editable field can be cleared, which removes its value from the patient record
- [ ] Email must be a valid email address format
- [ ] Mobile phone, Other phone and emergency contact Phone accept only characters used in phone numbers: digits, spaces, a leading plus sign, hyphens and brackets
- [ ] A field that fails validation shows an inline message beneath it, and the form cannot be saved until it is corrected

## Saving

- [ ] Saving updates the patient record immediately, without staff review
- [ ] Only the fields the patient changed are written, so a change made by staff to another field in the meantime is preserved
- [ ] On a successful save, the section returns to view mode showing the saved values and a brief confirmation appears
- [ ] If the save fails, the form stays open with the patient's edits intact and an error message is shown
- [ ] Changes made through the portal reach facility servers through the normal sync process and appear on the patient's record in Tamanu like any other update
- [ ] A patient can only edit their own record
