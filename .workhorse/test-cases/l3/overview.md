# Today's bookings displays incorrect times for overnight stays

The booking used throughout: a location booking from 12 Aug 10:00am to 14 Aug
11:30am, viewed on the facility dashboard's "Today's bookings" list as the
clinician it is assigned to.

Ticked cases are covered by the unit tests in
`packages/web/__tests__/views/dashboard/TodayBookingsPane.test.jsx` and
`packages/web/__tests__/components/DateTimeRangeDisplay.test.jsx`, or by
measuring the pane's CSS in a browser. The unticked ones need the running app.

## The reported bug

- [x] On the first day of the stay, the row shows the start time and the end time carrying its date, not two bare times (verifies spec: SCHEDULING)
- [x] On a middle day, the row carries a date on both ends (verifies spec: SCHEDULING)
- [x] On the last day, the row shows the start time carrying its date and the end time alone (verifies spec: SCHEDULING)
- [ ] The booking appears on all three days of the stay (verifies spec: SCHEDULING)
- [x] An overnight indicator appears on the row on each of those days (verifies spec: SCHEDULING)

## Bookings wholly within today

- [x] A booking that starts and ends today shows two times and no date at all (verifies spec: SCHEDULING)
- [x] No overnight indicator appears on it (verifies spec: SCHEDULING)
- [x] Its row is a single line, unchanged from before this card
- [x] A booking with no end time shows a single time and no indicator

## Timezone

- [x] A booking that sits within one day in the primary timezone but crosses midnight in the facility timezone is treated as overnight (verifies spec: SCHEDULING)
- [x] A booking that crosses midnight in the primary timezone but sits within one day in the facility timezone is not treated as overnight (verifies spec: SCHEDULING)
- [x] Which end's date is suppressed is decided against today in the facility timezone

## Locale and direction

- [ ] With the date/time locale set to es-ES, the range is fully visible and does not run over the booking card
- [ ] With the locale set to ja-JP, likewise
- [x] With the locale set to ur-PK, the day-month and the time beside it read in the intended order, with the am/pm marker attached to its own time (verifies spec: SCHEDULING)
- [ ] With no locale set, formatting follows the browser locale and the row still fits
- [x] A day-month date is not lowercased to "12 aug"

## Layout

- [x] Every booking card in the list starts at the same horizontal position, whatever mix of one-line and two-line rows the list holds
- [x] The time column widens only as far as the widest row needs, and no further
- [x] A two-line row does not clip, and the card grows to hold it rather than cutting text off
- [x] The overnight indicator sits on the second line with the end time, never on a line of its own
- [ ] The list does not gain a scrollbar at two or three bookings because of the taller rows
- [ ] The pane still fits its dashboard column with the tasks pane shown and hidden

The scrollbar case is not met, and did not start with this card: the timeline
separator is offset 21px, so the list overflows its own box and `overflow-y: auto`
shows a scrollbar. The same harness reproduces it with the pre-change CSS. The
per-row height allowance now covers a two-line row, so this change does not
worsen it, but the case stays open until the offset or the overflow is addressed.

## Regression

- [ ] The other surfaces using the shared date range display are unchanged: appointment detail, location bookings table, past bookings, and the two cancel modals
- [ ] Booking status colour, status indicator, and the tooltip on a truncated location or patient name all behave as before
- [ ] "View all…" still opens location bookings filtered to the clinician
