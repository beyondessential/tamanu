# Y5 — Bookings status indicators: test cases

Covers the dashboard's **Today's bookings** pane. The range wording is held by unit tests in
`packages/web/__tests__/views/dashboard/TodayBookingsPane.test.jsx`; everything below the first section
is CSS-dependent and the unit renderer does not apply CSS, so those cases are manual.

## Range wording (automated)

- [x] A booking with both ends on the day being listed shows two times (`8:30am – 9:00am`). Verifies spec: SCHEDULING
- [x] A booking starting today and ending later shows start time then end date (`10:00am – 14 Aug`). Verifies spec: SCHEDULING
- [x] On a day a stay merely covers, both ends show as dates (`12 Aug – 14 Aug`). Verifies spec: SCHEDULING
- [x] On the last day of a stay, the end shows as a time (`12 Aug – 11:30am`). Verifies spec: SCHEDULING
- [x] No day of a multi-day stay reads as a booking that began and ended today. Verifies spec: SCHEDULING
- [x] A booking with no end time shows its start alone. Verifies spec: SCHEDULING
- [x] Every booking carries an indicator of its status. Verifies spec: SCHEDULING

## Layout and rail (manual)

- [ ] The rail is exactly centred on the status indicators, as a single crisp line rather than a blurred double line. Verifies spec: SCHEDULING
- [ ] With several bookings, the rail begins at the first indicator and ends at the last, with no lead-in above the first and no run-out below the last. Verifies spec: SCHEDULING
- [ ] With exactly one booking, no rail is drawn at all. Verifies spec: SCHEDULING
- [ ] The rail does not show through the middle of an outlined indicator (Confirmed, Arrived).
- [ ] Every row is the same height, and overnight rows line up with same-day rows.
- [ ] The status indicator sits level with the range beside it.

## Narrow pane (manual)

- [ ] At the pane's normal width every range sits on one line. Verifies spec: SCHEDULING
- [ ] On a pane too narrow for a range, the range wraps onto two lines with its parts centred against each other, and the card keeps enough room to show its location and patient. Verifies spec: SCHEDULING
- [ ] The separator stays with the first line when a range wraps, rather than starting the second.

## Regressions worth re-checking

- [ ] No scrollbar appears on a list that fits (the overflow defect the previous rail layout caused).
- [ ] A list long enough to overflow still scrolls, and the footer rule stays put.
- [ ] Long location or patient names still ellipsise, and their tooltip still appears.
- [ ] Appointment detail, cancellation modals, past bookings and the location bookings table still date both ends of a multi-day booking and still show the overnight indicator. Verifies spec: SCHEDULING
