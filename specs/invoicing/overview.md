---
id: INVOICING
---

# Invoicing

Patient billing: invoices, products, price lists, and payments.

## Invoice items

Adding or editing an invoice item uses the same form and validation.

- [ ] Details (the product) is required on every item; saving is blocked with an inline required message when it is empty.
- [ ] Ordered by is required on every item; saving is blocked with an inline required message when it is empty.
- [ ] Ordered by is prefilled with the encounter's supervising clinician and stays editable.

## Invoice actions

- [ ] Users who cannot edit invoices are offered only the invoice actions that leave the
      invoice unchanged, such as View patient details and Print invoice. Insurance plan, Add
      item, Edit items, Mark all as approved, Remove all approvals, Cancel invoice and
      Finalise are hidden from them, as is each item's actions menu.
- [ ] When the patient field settings hide the insurance plan field, the invoice's Insurance
      plan action is hidden, and Record payment opens the record payment form without the
      "No insurance plan added" confirmation.

## Patient details

The patient's details can be viewed and edited from an invoice without leaving it.

- [ ] The invoice's actions menu lists View patient details first, on invoices of every
      status.
- [ ] View patient details is offered to the users who can open the patient's Details tab:
      those who can read, write or create patient records.
- [ ] View patient details opens the patient details modal over the invoice. The modal
      holds the Details tab's sections, fields and validation (see `patient/details.md`),
      with Cancel and Save kept in view at the bottom however far the form is scrolled.
- [ ] For users who cannot edit patient records, Save is disabled, and hovering it shows
      "You do not have permission to edit patient details".
- [ ] Saving updates the patient's record, closes the modal and shows "Patient details
      successfully updated". 
- [ ] A save blocked by validation keeps the modal open and brings the first field with a
      message into view.
- [ ] Cancel, Escape and the close button close the modal without saving.
- [ ] When the modal has unsaved edits, closing it first asks for confirmation, titled
      "Unsaved changes", reading "You have unsaved changes. Are you sure you would like to
      discard those changes?" Go back returns to the modal with the edits kept, and Discard
      changes closes it.

### Adding an insurance plan

- [ ] When the patient has no insurance plans recorded, the invoice's Insurance plan action
      shows "No insurance plan recorded". Its Go to patient details opens the patient
      details modal over the invoice, scrolled to and focused on the insurance plan field.
- [ ] Go to patient details, and Add insurance plan on Record payment (see
      [Patient payments](#patient-payments)), are offered on in-progress invoices, to users
      who can edit invoices.
- [ ] When the modal is opened to add an insurance plan, saving it with a plan available at
      the invoice's facility opens Insurance plans, the invoice's plan picker, to choose
      which of the patient's plans apply to the invoice. The picker opens with the invoice's
      current plans selected, so plans just added to the patient start unselected. Saving
      the picker applies the chosen plans, and the invoice's amounts due reflect them
      straight away.
- [ ] Saving the modal with no insurance plan available at the invoice's facility, whether
      the patient has no plans or only plans restricted to other facilities, returns to the
      invoice without opening the picker.
- [ ] Opened from Insurance plan, cancelling the modal, or saving or cancelling the picker,
      returns to the invoice.

## Patient payments

- [ ] Record payment on an invoice with no insurance plans, where the insurance plan field
      is shown (see [Invoice actions](#invoice-actions)), first asks for confirmation,
      titled "No insurance plan added". It reads "No insurance plan has been added to this
      invoice yet. Insurance plans affect the patient amount that is due." followed by
      "Are you sure you would like to continue?"
- [ ] The confirmation offers Go back, Add insurance plan, and Continue without insurance
      plan, with Continue without insurance plan as the primary action. Add insurance plan
      is offered as set out in [Adding an insurance plan](#adding-an-insurance-plan).
- [ ] Go back, Escape and the close button return to the invoice without recording a
      payment.
- [ ] Continue without insurance plan opens the record payment form.
- [ ] When the patient has no insurance plans available at the invoice's facility, Add
      insurance plan opens the patient details modal over the invoice, scrolled to and
      focused on the insurance plan field. Saving it with a plan available at the invoice's
      facility opens Insurance plans (see
      [Adding an insurance plan](#adding-an-insurance-plan)).
- [ ] When the patient has insurance plans available at the invoice's facility, Add
      insurance plan opens Insurance plans directly.
- [ ] Saving Insurance plans with at least one plan selected applies those plans and then
      opens the record payment form, with the patient total due reflecting them.
- [ ] Saving Insurance plans with no plan selected, cancelling it, cancelling the patient
      details modal, or saving the modal with no plan available at the invoice's facility,
      returns to the invoice without recording a payment.
- [ ] Record payment on an invoice that has insurance plans opens the record payment form
      directly.

## Insurance plans

- [ ] An insurance plan can be restricted to a set of facilities; a plan with no facilities set is available at every facility.
- [ ] When adding an insurance plan to an invoice, only plans available at the invoice's facility are offered.
