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
