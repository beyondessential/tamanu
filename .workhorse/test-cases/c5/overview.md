# C5 test cases

Discharge modal medication section: the dispensing quantity may be left blank, and a blank is
recorded as zero against the prescription. The ordering prescriber is only marked required once
something is being sent to pharmacy.

## Dispensing quantity validation

- [x] A blank dispensing quantity is accepted on a row that is not being sent to pharmacy.
- [x] A zero dispensing quantity is accepted on a row that is not being sent to pharmacy.
- [x] A blank, null or zero quantity is rejected on a row that is being sent to pharmacy.
- [x] A negative quantity is rejected whether or not the row is being sent to pharmacy.
- [x] Rows are validated independently: one row blank and unticked alongside another ticked with a
      quantity passes.
- [x] The prescription form and the discharge form apply the same rule, from the same shared schema.

## Required markers

- [x] The ordering prescriber is not marked required while nothing is selected to send to pharmacy.
- [x] The ordering prescriber is marked required once a medication is selected.
- [x] The "Dispensing qty" column header carries no blanket required ornament.
- [ ] A row's quantity input is marked required only once that row is ticked for pharmacy.

## Server normalisation

- [x] Empty string, null, undefined and an absent key all record as zero.
- [x] A non-numeric quantity is rejected rather than silently zeroed.
- [x] More repeats than allowed is rejected.
- [x] A discharge medications payload normalises blank rows without dropping the medication.

## Discharge route, end to end

These need a running facility server and database, so they were not exercised locally — the local
facility test database is not set up and its integration suites fail with or without this change. The
ticked case is covered by a Playwright case in `patientDischarge.spec.ts`, which CI runs.

- [x] Discharging with every medication unticked and every quantity blank completes, and does not
      error on the dispensing quantity.
- [ ] Discharging with a blank quantity records zero against that prescription.
- [ ] An unticked row records its quantity against the prescription (zero where blank), including
      rows in the "Other ongoing medication" table. Confirmed with Design as intended.
- [ ] A ticked row with a quantity of at least one still raises a pharmacy order for that row only.
- [ ] Discharging with a ticked row but no ordering prescriber is rejected.
- [ ] A blank repeats field does not fail the discharge, and records zero.

## Manual verification

- [x] Reproduce the original report: open the discharge modal for an encounter with medications,
      leave "send to pharmacy" unselected, and confirm the discharge completes. Covered by the
      Playwright case above.
- [ ] With all checkboxes cleared, the ordering prescriber shows no red asterisk and is disabled.
