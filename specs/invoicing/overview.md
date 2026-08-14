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
- [ ] A row that has not been saved yet can be removed from the table, so an unwanted row is discarded without abandoning the rest of the form.
- [ ] A saved line has no remove control in the form; it is deleted through the Delete action on the invoice view, so editing cannot drop it.
- [ ] Saving keeps every row shown in the table; no row is dropped silently.
