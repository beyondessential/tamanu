# View patient details from an invoice

## Base

Branched off `epic-palau-invoicing`. X11's Billing information section is merged into the epic, so
the form the modal reuses is already there and the dependency note below is settled.

L1 (`workhorse/l1`, PR #11672) is open against the same epic and touches two of the files this card
changes: `EncounterInvoicingPane.jsx` (12 lines) and `InvoiceModalGroup.jsx` (3). It also rewrites
`InvoiceForm.jsx` heavily, which this card touches only to hide Add item. Whichever lands second
rebases; the conflict surface is small and the cards stay independently mergeable.

## Decisions taken at interview

- The modal is editable only on an **in-progress** invoice, and only for users who can edit patient
  records. A finalised or cancelled invoice shows every field read-only with a single Close button.
  This settles the card's refinement question against the first spec draft, and the spec has been
  amended.
- The read-only mode is wired into the invoicing modal only. The Details tab keeps its current
  behaviour, where a read-only user gets an editable form that 403s on save. That gap is real but
  is not this card's to close.
- The read-only modal offers Close alone, with no route through to the Details tab. Both read-only
  cases look identical.
- The broader invoice-action permission gating is built here, as specced.
- Coverage is web unit tests. E2E is left to a follow-up, as L1 did.

## What already exists

- `BaseModal` takes `fixedBottomRow` and `bottomRowContent`, which is the sticky Cancel/Save row.
- `Form` renders `ScrollToError`, so bringing the first field with a message into view is free.
- `ConfirmModal` with `general.action.goBack` and `general.action.discardChanges` already carries
  the exact Unsaved changes copy the spec names, in the settings editor's `WarningModal`.
- `InvoiceInsuranceModal` already has the No insurance plan recorded empty state, but its Go to
  patient details **navigates away** to the Details tab rather than opening a modal.
- The insurance plan field is `fields.invoiceInsurancePlanId`, hideable, default shown.
- `isInvoiceEditable(invoice)` is in-progress only, so it is the read-only trigger.

## Build

- [x] **Form-wide read-only.** A context in `@tamanu/ui-components` consumed by `FieldBase`, forcing
      `disabled` on every field. `Field` is the single chokepoint: `LocalisedField` and
      `ConfiguredMandatoryPatientFields` both route through it, so one consumer covers every section
      of the patient details form. A field's own `disabled` still applies on top.
- [x] **`PatientDetailsModal`** in `features/Invoice`, titled Patient details at `md` width. Fetches
      the patient, additional data, birth data and insurance plans with the hooks `PatientView`
      already uses, renders `PatientDetailsForm`, and saves the way `DetailsPane` does, including the
      "Patient details successfully updated" notification and the patient query invalidation.
- [x] **Sticky actions.** Cancel and Save in `bottomRowContent` when editable, a single Close when
      not. The buttons sit outside the form element and `Form` passes no `id` through, so Save calls
      the `submitForm` the render prop already exposes, as `PatientLetterForm` does.
- [x] **Unsaved changes.** Track formik `dirty` from inside the form and lift it to the modal, so
      Cancel, Escape and the close button all route through the confirmation when the form is dirty.
      Reuse `ConfirmModal` with the existing Go back and Discard changes string ids.
- [x] **Invoice actions menu.** View patient details first, on every status, for users who can read,
      write or create patient records. Hide Insurance plan, Add item, Edit items, Mark all as
      approved, Remove all approvals, Cancel invoice and Finalise from users who cannot edit
      invoices, and each item's actions menu with them.
- [x] **Insurance plan field hidden in settings** hides the invoice's Insurance plan action and drops
      the Record payment confirmation.
- [x] **Adding an insurance plan.** The No insurance plan recorded empty state's Go to patient
      details opens the modal over the invoice, scrolled to and focused on the insurance plan field,
      instead of navigating. Saving with a plan available at the invoice's facility opens the plan
      picker with the invoice's current plans selected; with none available it returns to the
      invoice. Offered on in-progress invoices, to users who can edit invoices.
- [x] **Record payment.** The No insurance plan added confirmation, with Go back, Add insurance plan
      and Continue without insurance plan. Three buttons, so not `ConfirmModal`: Go back sits left
      and the other two group right, with Continue without insurance plan primary. Add insurance plan
      goes straight to the picker when the patient has a plan available at the facility, and through
      the patient details modal when not.

## Tests

- [x] Modal gating: which statuses and permissions give an editable modal, and which a read-only one.
- [x] Read-only mode disables every field and shows Close in place of Cancel and Save.
- [x] Unsaved-changes confirmation fires on each of the three close routes, and only when dirty.
- [x] Invoice action visibility against the invoice-edit permission and the hidden-field setting.
- [x] Insurance-plan routing: which of the picker, the modal and the invoice each entry point lands
      on, including the no-plan-at-this-facility case.

## Follow-ups to card

- E2E coverage of the menu, the modal, a save and the insurance-plan route.
- Read-only patient details on the Details tab itself, where a user with only `read` on Patient
  currently gets an editable form that fails on save.
