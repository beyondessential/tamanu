# Recording vitals in a triage started from the appointment popper

## Regression

- [ ] Scheduling > Outpatient appointments, open an appointment tile, choose **Admit or check in** > Triage, then **Record vitals**: the vitals form opens in a modal, with no error page
- [ ] In the same triage, record a set of vitals and submit the triage: the triage saves with the vitals, and the appointment is linked to the new encounter
- [x] The nested vitals modal renders its form with no encounter in context (automated: `NestedVitalsModal.test.jsx`)

## Unchanged paths

- [ ] Triage from the patient page: **Record vitals** opens the form and the triage submits with its vitals
- [ ] An encounter's **Vitals** tab: **Record vitals** opens the form and saves a set of vitals
