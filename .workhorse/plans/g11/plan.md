# Outpatient appointments search, filters and sort

## Technical notes

- **Arrival time has to be recorded.** Appointments only carry a status, so sorting by arrival needs a new arrival-time column on `appointments`. Set it when the status first moves to Arrived, Assessed or Seen, and clear it when the status goes back to Confirmed. This needs a server migration, a matching mobile migration and a dbt model update. Avoid deriving it from `logs.changes`.
- **Sorting happens on the server.** `GET /appointments` already takes `orderBy` and `order`. Arrival-time ordering needs a status-group ordering ahead of the time columns.
- **Status filter.** Pass ticked statuses to the list endpoint. When Cancelled is ticked, the request also needs `includeCancelled`, because cancelled appointments are excluded by default.
- **Both Area and Clinician filters show in every grouping.** This drops the effect in `OutpatientAppointmentsFilter.jsx` that clears the other filter when the grouping changes.
- **Sort order is remembered** alongside the filters in user preferences, which are saved per facility.
- **QR scan** reuses the scanner modal and button from `QRCodeSearchField`, writing into `patientNameOrId`.
