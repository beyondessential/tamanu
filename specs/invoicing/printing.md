---
id: INVPRT
---

# Printing invoices

Applies to printing an invoice from the encounter's invoicing tab, to hand to the patient or keep on file, in the layout each facility chooses: a full A4 page, or a receipt on 80 mm thermal roll paper for facilities that print at a point-of-sale printer.

## Printing an invoice

- An in-progress invoice is printed from the invoice's actions menu (**Print invoice**); a finalised or cancelled invoice is printed from its **Print** button.
- The print screen shows a preview of the printout, and printing sends the previewed printout to the printer.
- A bed-fee line whose quantity has dropped to zero after a ward move carries no charge and is left off the printout.
- The printout uses the print layout of the facility it is printed at.
- Both layouts are built from the same invoice and the same totals, so an invoice prints the same figures whichever layout the facility uses.

## Print layout setting

- Each facility chooses its invoice print layout with the facility setting **Invoicing → Invoice print layout** (`invoicing.printLayout`).
- The setting takes one of two values: `a4` for the A4 layout, or `receipt` for the receipt layout. It defaults to `a4`.
- The setting's description reads: "Layout used when printing an invoice at this facility. Receipt prints on 80mm thermal roll paper."

## A4 layout

- The A4 layout is a full-page document that flows onto further pages as needed. Pages after the first carry a running header with the invoice number, patient name and patient ID.
- It shows the facility letterhead with the invoice number, the patient's details, the encounter details, the invoice details, a table of invoice items with any item adjustments, a summary of the invoice totals ending in the patient total due, any patient and insurance plan payments, and the invoice footer image where one is configured.

## Receipt layout

### Format

- The receipt prints on 80 mm thermal roll paper, and is a fixed 80 mm wide.
- All content sits within the printer's 72 mm printable width.
- Long text, such as an item name, wraps onto further lines and is never cut off.
- The receipt is one continuous strip as long as its content, with no page breaks and no fixed page length.
- Each section is divided from the next by a horizontal dotted line, and a dotted line follows the patient total due.
- The facility name and the section titles are set in bold, and the section titles are printed in capitals.
- The labels Name, Date of birth, Patient ID, Invoice number, Date and Invoice total are set in bold.
- The patient total due, both its label and its amount, is set in bold capitals a little larger than the section titles.
- Every amount is right-aligned, including each line item's line total.
- Line items are spaced further apart than the lines of a wrapped item name, so each item stands apart from the next.

### Content

- The receipt shows its sections in this order: header, patient details, invoice, details, and patient total due.
- **Header**: the letterhead logo where one is configured, then the facility name and address, taken from the letterhead title and subtitle.
- **Patient details**, under that section title: the patient's name, date of birth and patient ID (display ID).
- **Invoice**: the invoice number and the invoice date.
- **Details**, under that section title: the line items, then a dotted line, then the totals. An invoice with no items shows the totals directly under the section title, with no dotted line.
- Line items: one line per invoice item, in the same order as the A4 layout, showing the item name with its quantity after it, such as Blood Sugar x 3, and its line total before any item adjustment.
- A medication's quantity carries its dispensing unit, as on the A4 layout, such as Paracetamol 500mg x 10 Tablets.
- Totals: invoice total, item adjustments, insurance coverage, patient subtotal, fee scale adjustment and patient payments, each the same figure as in the A4 layout's summary of totals.
- Insurance coverage is the invoice's total coverage, shown as a single figure.
- The fee scale adjustment appears only when the invoice has a fee scale discount, as on the A4 layout. It still appears after the sliding fee scale (`features.invoicing.slidingFeeScale`) is switched off, since the discount still comes off the patient total due. Its label carries the invoice's fee scale percentage.
- Insurance coverage, the fee scale adjustment and patient payments are shown as deductions, as negative amounts, as on the A4 layout.
- Every other total is shown as 0.00 when there is nothing to record.
- **Patient total due**: the same figure as the A4 layout's patient total due.

### Labels

- Every label on the receipt is translatable, and so is the way a line item's quantity is shown beside its name.
- Patient field labels follow the deployment's localised field names, so a deployment that renames the patient ID shows its own name for it on the receipt.
- Labels default to: Patient details, Name, Date of birth, Patient ID, Invoice number, Date, Details, Invoice total, Item adjustments, Insurance coverage, Patient subtotal, Fee scale adjustment - N% (where N is the invoice's fee scale percentage), Patient payments, Patient total due.
- Labels printed in capitals are capitalised when printed, so a translation is entered in its normal case.
