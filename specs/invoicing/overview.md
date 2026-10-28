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

## Patient payments

Recording and editing a patient payment use the same form.

- [ ] Date, Method and Amount are required.
- [ ] Method offers the payment methods from reference data, plus MSA, which is built in and always available.
- [ ] When the method is MSA, a Reference number field appears beside Method.
- [ ] Reference number accepts digits only.
- [ ] Reference number is optional; an MSA payment can be recorded without one.
- [ ] The form widens to fit Reference number, and the other fields keep their size.
- [ ] Changing the method from MSA to another method removes the Reference number field and clears its value.
- [ ] The reference number is saved with the payment. Editing an MSA payment shows its saved reference number, which can be changed.

## Insurance plans

- [ ] An insurance plan can be restricted to a set of facilities; a plan with no facilities set is available at every facility.
- [ ] When adding an insurance plan to an invoice, only plans available at the invoice's facility are offered.
