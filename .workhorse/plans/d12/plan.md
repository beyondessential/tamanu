# Updates to patient level table and printing

## Tech notes

### Total balance

- The total balance above the patient invoices table is the sum of the patient total due on every in-progress and finalised invoice. Cancelled invoices are left out. The `totalOutstandingBalance` route in `packages/facility-server/app/routes/apiv1/patient/patientInvoice.js` filters to finalised invoices today, so that filter widens to include in-progress ones

### Cancelled invoices

- Cancelled invoices stay in the patient invoices table. Their Patient total due shows "n/a"; the other money columns show their amounts as usual
- They are left out of the total balance and the printed summary

### Admission column

- An invoice whose encounter changed type shows every type it has held, in the order it held them, as comma-separated abbreviations (e.g. "ESS, HA"). The table shows only the encounter's current type today (`getEncounterType` in `InvoicesTable.jsx`); the earlier types come from the encounter's history (`EncounterHistory`), which the invoices list route needs to include

### Title alignment when the table scrolls

- The table title (`TableTitle` in `InvoicesTable.jsx`) is sized to the visible width of the scroll container, so on narrow screens "Total balance" lands partway across the table
- Giving the invoices table's container `display: grid` makes the title span the table's full scroll width, so the total sits over the right end of the table. Pass it through the `Table` component's existing `containerStyle` prop rather than changing the shared `StyledTableContainer`, which every table uses
- The table's right-hand spacer column (the row `::after` cell) collapses to nothing once the table is narrow enough to scroll, and the last cell has no right padding, so the Status badges sit against the edge. The last cell carries the full right padding instead, matching the 30px on the left

### Print table summary

- An overflow menu (`ThreeDotMenu`, as on the encounter invoicing pane) sits beside the total balance in the table title, with a single "Print table summary" option
- The option opens a print modal following `InvoiceRecordModal`: a `Modal` titled "Print table summary", `printable`, with the PDF in a `PDFLoader`
- The PDF is a new printout in `packages/shared/src/utils/patientCertificates/`, built from the same pieces as `InvoiceRecordPrintout`: `MultiPageHeader`, `LetterheadSection`, `PatientDetails`, the invoice item table styling, a summary pane holding the total balance, and `Footer`
- The printout is titled "Patient invoice summary" and lists all of the patient's in-progress and finalised invoices, not only the page shown in the table, so it needs its own unpaginated fetch
- The printout is landscape A4 (`<Page size="A4" orientation="landscape">`, as in `EncounterRecordPrintout`), so its columns have room
- The printout has one column per insurance plan found on any of the listed invoices, headed by the plan's name (its code where it has no name), between Invoice total and Patient subtotal. Each cell is that plan's coverage of that invoice, from `getFormattedCoverageAmountPerInsurancePlanForInvoice` shown as a positive amount, and $0.00 where the plan isn't on the invoice. The on-screen table has no insurance columns
- Every column in the printout, amounts included, is left-aligned, headings and values alike. This differs from `InvoiceRecordPrintout`, whose cost columns are right-aligned (`justifyContent: 'flex-end'`), so don't carry that style across. The first column has no left padding, so dates line up with the table's left edge and the patient details above (`InvoiceRecordPrintout` indents its first column with `paddingLeft: 13`)
