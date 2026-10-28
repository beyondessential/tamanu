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

## Insurance plans

- [ ] An insurance plan can be restricted to a set of facilities; a plan with no facilities set is available at every facility.
- [ ] When adding an insurance plan to an invoice, only plans available at the invoice's facility are offered.

## Sliding fee scale discount

- [ ] The sliding fee scale discount assessment opens with the family size and annual
      income saved on the patient's details already selected (see `patient/details.md`).
- [ ] A saved annual income band that is not one of the current bands for the family size
      is left unselected in the assessment.
- [ ] Either answer can be changed in the assessment. The change applies to that invoice's
      discount and leaves the patient's details as they were.
