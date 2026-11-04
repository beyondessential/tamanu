---
id: OPAPPT
---

# Outpatient appointments calendar

The outpatient appointments calendar shows a facility's outpatient appointments for a selected day, in columns grouped by area or by clinician. Staff narrow it with a patient search and filters, and choose how appointments are ordered within each column. See `scheduling/overview.md` for scheduling as a whole.

## Search and filter row

The search, filters and sort control sit together in one row at the top of the calendar, above the date selector. The page's top bar holds the page title, the area and clinician grouping toggle, and the book appointment action.

- [ ] The row holds, in order, the patient search, a QR code scan button, the Status, Type, Area and Clinician filters, and a Clear filters action, with the sort control at the far end of the row.
- [ ] The same search, filters and sort control show whether the calendar is grouped by area or by clinician.
- [ ] Changing the grouping leaves the search, filter selections and sort order as they were.

## Patient search

- [ ] The search matches appointments whose patient's full name or patient ID contains the text entered, ignoring case.
- [ ] The calendar updates to show only matching appointments as the user types.
- [ ] The QR code scan button sits immediately beside the search field and opens the QR code scanner used by the all patients search.
- [ ] A scanned code fills the search field with its value, and the calendar updates to show the matching appointments.

## Filters

Each filter offers a list of options the user can tick, and any number of options can be ticked at once.

- [ ] The Status filter lists every appointment status: Confirmed, Arrived, Assessed, Seen, No-show and Cancelled.
- [ ] The Type filter lists the appointment types, the Area filter lists the facility's areas, and the Clinician filter lists clinicians.
- [ ] With options ticked in a filter, the calendar shows only appointments matching one of them. Appointments must match every filter that has options ticked.
- [ ] A filter with no options ticked lets through appointments of every option it lists. The one exception is cancelled appointments, which show only when Cancelled is ticked in the Status filter.
- [ ] A filter with options ticked shows how many are ticked beside its name, highlighted in the primary colour.
- [ ] Clear filters unticks every filter and empties the patient search. The sort order is left as it was.
- [ ] When the search and filters match no appointments, the calendar says so and suggests adjusting the search filters.

## Sorting

The sort control is a dropdown that orders the appointments within each column. While open it reads "Sort by" and lists the two orders, with the current one highlighted.

- [ ] **Booking time** orders appointments by the time they are booked for, earliest first.
- [ ] **Arrival time** puts first the appointments whose patient has arrived, meaning those marked Arrived, Assessed or Seen, earliest arrival at the top. Appointments not yet arrived follow in booking-time order, then no-shows and cancelled appointments last, in booking-time order.
- [ ] An appointment's arrival time is when it was first marked Arrived, Assessed or Seen. Moving it back to Confirmed clears its arrival time.
- [ ] An arrived appointment with no recorded arrival time sorts after the arrived appointments that have one, in booking-time order.
- [ ] Booking time is the order used until a user picks another.

## Remembered choices

- [ ] A user's filter selections, sort order and grouping are remembered for them at each facility, and restored when they return to the calendar.
- [ ] The patient search starts empty each time the calendar is opened.
