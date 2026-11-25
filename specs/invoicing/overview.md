---
id: INVOICING
---

# Invoicing

Applies to patient billing: invoices and their items, products, price lists, payments, and the insurance plans an invoice can draw on.

## Invoice items

- Adding an invoice item and editing one use the same form and the same validation.
- Details (the product) is required on every item; saving is blocked with an inline required message when it is empty.
- Ordered by is required on every item; saving is blocked with an inline required message when it is empty.
- Ordered by is prefilled with the encounter's supervising clinician and stays editable.

## Insurance plans

- An insurance plan can be restricted to a set of facilities; a plan with no facilities set is available at every facility.
- When adding an insurance plan to an invoice, only plans available at the invoice's facility are offered.

### One plan per invoice

- The invoicing setting One insurance plan per invoice limits an invoice to a single insurance plan. It is off by default.
- With the setting on, the insurance plan field takes one plan, and choosing another plan replaces it.
- On a [split invoice](encounter-type-sections.md) the limit applies to each section, so the Emergency and Inpatient sections each carry at most one plan.
- With the setting off, an invoice or section takes any number of plans.

### NHI

- A deployment names its NHI plan by the plan's code in the invoicing settings. Where no NHI plan is named, every plan is offered as described above.
- NHI is offered only on an inpatient invoice, one whose encounter is in the Inpatient category of the [encounter-type taxonomy](encounter-fees.md#encounter-type-taxonomy), and on the Inpatient section of a split invoice.
- Choosing NHI shows a Copayment insurer field below the insurance plan, introduced by the text "If applicable, select an insurer below to cover the patient's copayment."
- Copayment insurer offers the patient's other insurance plans available at the invoice's facility, NHI excluded.
- Copayment insurer is optional. With none chosen, the copayment is the patient's to pay.
- The copayment insurer is recorded with the NHI plan on the invoice or section that plan covers.
- Removing NHI, or replacing it with another plan, clears the copayment insurer.

> [!NOTE]
> NHI covers the ward part of a stay and not the emergency part, which is why it is held back from emergency and outpatient invoices and sections.

> [!NOTE]
> NHI leaves the patient a copayment. A patient with private cover can have that insurer settle it, so the copayment insurer is chosen alongside NHI rather than as a second plan on the same invoice.
