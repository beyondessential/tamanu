---
id: PTINV
---

# Patient invoices

Applies to the table of a patient's invoices on their Invoices tab, the total balance above it, and the Patient invoice summary printed from it.

## Invoices table

- The table lists every one of the patient's invoices, cancelled ones included.
- Its columns, in order, are Date, Invoice number, Admission, Invoice total, Patient subtotal, Patient total due, Payment status and Status.
- Invoice total is the invoice's total before insurance coverage.
- Patient subtotal is the part of the invoice the patient is responsible for once insurance coverage is taken off.
- Patient total due is what the patient still owes on the invoice: their share after any discount, less the payments they have made, and never below zero.
- Patient total due shows "n/a" on a cancelled invoice. Its other amounts show as on any other invoice.
- Admission shows each encounter type the invoice's encounter has held, in the order it held them, as comma-separated abbreviations (for example "ESS, HA"). Hovering an abbreviation shows its full name.
- Payment status describes the patient's share of the invoice. Where the insurer has rejected its payment, the status is followed by "/Rejected".
- A user who can read invoices opens an invoice's encounter at its Invoicing tab by selecting the invoice's row.

## Total balance

- The table's title carries the patient's total balance: the sum of Patient total due across every in-progress and finalised invoice.
- Cancelled invoices are left out of the total balance.
- The total balance sits at the right-hand end of the table, including when the table is wider than the screen and scrolls sideways.

## Printing the table summary

- An overflow menu beside the total balance offers Print table summary.
- Print table summary opens a print window of that name, showing the Patient invoice summary with an action to print it.

### Patient invoice summary

- The summary is a landscape page in the same style as Tamanu's other printouts, headed by the facility letterhead and the title "Patient invoice summary".
- Below the title are the patient's details: first name, last name, date of birth with age, patient ID, sex and village.
- It lists all of the patient's in-progress and finalised invoices, newest first, whichever page of the table is on screen. Cancelled invoices are left out.
- Its columns, in order, are Date, Invoice number, Admission, Invoice total, Patient subtotal, Patient payments, MSA, NHI payments, Insurance payments and Payment status, each holding the same value as the table where both have it.
- Patient payments is the total the patient has paid towards the invoice. Refunded payments, and the refunds themselves, are left out.
- MSA is the part of Patient payments recorded with the MSA payment method, and $0.00 where there is none.
- NHI payments is the NHI insurance plan's coverage of the invoice, and $0.00 where the plan is not on the invoice.
- Insurance payments is the invoice's coverage from every other insurance plan, and $0.00 where there is none.
- Every column is left-aligned, headings and amounts alike.
- A box beneath the table shows the patient's total balance, the same figure as above the invoices table.
- Each page's footer shows the print date and time, and the page number out of the total.

> [!NOTE]
> The summary is handed to the patient as a record of their account, so it breaks each invoice down by who paid towards it.

### NHI insurance plan

- An administrator names which insurance plan is the NHI plan in settings.
- When no NHI plan is named, the summary has no NHI payments column, and Insurance payments holds the coverage from every insurance plan.
