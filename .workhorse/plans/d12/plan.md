# Updates to patient level table and printing

## Tech notes

### Total balance

- The total balance above the patient invoices table is the sum of every invoice's patient total due, whatever its status. The `totalOutstandingBalance` route in `packages/facility-server/app/routes/apiv1/patient/patientInvoice.js` filters to finalised invoices today, so that filter changes with it
- Whether cancelled invoices count towards the total is not yet decided

### Title alignment when the table scrolls

- The table title (`TableTitle` in `InvoicesTable.jsx`) is sized to the visible width of the scroll container, so on narrow screens "Total balance" lands partway across the table
- Giving the invoices table's container `display: grid` makes the title span the table's full scroll width, so the total sits over the right end of the table. Pass it through the `Table` component's existing `containerStyle` prop rather than changing the shared `StyledTableContainer`, which every table uses
