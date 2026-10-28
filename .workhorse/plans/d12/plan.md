# Updates to patient level table and printing

## Tech notes

### Total balance

- The total balance above the patient invoices table is the sum of the patient total due on every in-progress and finalised invoice. Cancelled invoices are left out. The `totalOutstandingBalance` route in `packages/facility-server/app/routes/apiv1/patient/patientInvoice.js` filters to finalised invoices today, so that filter widens to include in-progress ones

### Admission column

- An invoice whose encounter changed type shows every type it has held, in the order it held them, as comma-separated abbreviations (e.g. "ESS, HA"). The table shows only the encounter's current type today (`getEncounterType` in `InvoicesTable.jsx`); the earlier types come from the encounter's history (`EncounterHistory`), which the invoices list route needs to include

### Title alignment when the table scrolls

- The table title (`TableTitle` in `InvoicesTable.jsx`) is sized to the visible width of the scroll container, so on narrow screens "Total balance" lands partway across the table
- Giving the invoices table's container `display: grid` makes the title span the table's full scroll width, so the total sits over the right end of the table. Pass it through the `Table` component's existing `containerStyle` prop rather than changing the shared `StyledTableContainer`, which every table uses
