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

## Printed invoice

The printed invoice carries blank lines for signing and dating by hand.

- [ ] Every printed invoice has three signature lines, in this order: "Patient signature", "Or person responsible signature" and "Witness signature".
- [ ] Each signature line has a "Date" line beside it.
- [ ] The signature lines sit together, without a heading, after the invoice's payment tables.
- [ ] When an invoice footer image is set up, the signature lines come before it, so the footer image ends the invoice.
- [ ] The signature lines are never split across pages. On an invoice that runs to several pages, they appear once, at the end.
