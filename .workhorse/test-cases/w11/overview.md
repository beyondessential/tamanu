# View patient details from an invoice

Scenarios that verify the card. Ticked cases are covered by the web unit tests added on this branch;
unticked ones are still owed, most of them needing a running app with configured permissions.

End-to-end coverage of the whole chain is recorded as needing a card of its own.

## The invoice's actions menu

- [ ] View patient details is the first entry in the menu.
- [ ] It is offered on an in-progress, a finalised and a cancelled invoice.
- [ ] It is offered on an invoice with no items, where the menu otherwise has little in it.
- [ ] A user with only `read` on Patient is still offered it (verifies spec: invoicing overview,
      Patient details).
- [ ] A user with no Patient permission at all is not offered it, and sees no empty menu left behind.
- [ ] A user without `write` on Invoice sees View patient details and Print invoice, and none of
      Insurance plan, Add item, Edit items, Mark all as approved, Remove all approvals, Cancel
      invoice or Finalise (verifies spec: invoicing overview, Invoice actions).
- [ ] That user also sees no actions menu on any invoice item.
- [ ] A user with `write` on Invoice still sees every action they saw before this card.

## The patient details modal

- [ ] It opens over the invoice, with the invoice still behind it.
- [ ] It holds the same sections and fields as the patient's Details tab, Billing information
      included.
- [ ] Cancel and Save stay in view when the form is scrolled to the bottom.
- [x] Cancel and Save show when the details can be edited; a single Close replaces them when they
      cannot.
- [x] An in-progress invoice gives an editable modal; a finalised or cancelled one gives a read-only
      modal.
- [x] A user who cannot edit patient records gets a read-only modal on an in-progress invoice.
- [x] Read-only disables every field.
- [ ] A read-only modal shows the patient's recorded insurance plans rather than an empty field.
- [x] Saving updates the patient and the modal closes.
- [ ] Saving shows "Patient details successfully updated".
- [ ] A save blocked by validation keeps the modal open and brings the first message into view.
- [x] A save the server rejects leaves the modal open.
- [x] Cancel, Escape and the corner close button close the modal when nothing has been edited.
- [x] Each of those three asks for confirmation when the form has unsaved edits.
- [x] Go back returns to the modal with the edits still there.
- [x] Discard changes closes the modal.
- [ ] Reopening after discarding shows the patient's saved details, not the discarded edits.

## Adding an insurance plan

- [x] The plan picker's empty state offers Go to patient details only where a plan can still be added
      to this invoice.
- [x] Go to patient details opens the modal, which lands focused on the insurance plan field.
- [ ] The field is actually scrolled into view, not merely focused off-screen.
- [x] Saving the modal with a plan now available at this facility opens the plan picker.
- [x] Saving it with no plan available at this facility returns to the invoice.
- [ ] A patient whose only plans are restricted to other facilities counts as having none.
- [ ] The picker opens with the invoice's current plans selected, so a plan just added to the patient
      starts unselected.
- [ ] Saving the picker applies the plans and the invoice's amounts due change straight away.
- [x] Closing the picker, or closing the modal, returns to the invoice.

## Recording a payment

- [x] Record payment on an invoice with no insurance plan asks for confirmation first.
- [x] Record payment on an invoice that has a plan opens the payment form directly.
- [x] Go back returns to the invoice and records nothing.
- [x] Continue without insurance plan opens the payment form.
- [x] Add insurance plan is offered only where a plan can still be added to this invoice.
- [x] It opens the picker where the patient has a plan available at this facility, and the patient's
      details where they do not.
- [ ] Saving the picker with at least one plan selected opens the payment form, with the patient
      total due reflecting the plans.
- [ ] Saving the picker with nothing selected returns to the invoice without recording a payment.
- [ ] Escape and the corner close button on the confirmation return to the invoice.

## Deployment settings

- [x] Where `fields.invoiceInsurancePlanId.hidden` is set, Record payment skips the confirmation.
- [x] Where it is set, Add insurance plan is not offered anywhere.
- [ ] Where it is set, the invoice's Insurance plan action is hidden.
- [ ] Where it is not set, every insurance behaviour above is unchanged.

## Elsewhere in the product

- [ ] The patient's Details tab still saves, with its own Save button in place.
- [ ] A multiselect field elsewhere in the product still shows its value when disabled.
