# Today's bookings displays incorrect times for overnight stays

## Diagnosis

The dashboard bookings pane renders the range as two bare times of day, with no
awareness that the booking may span more than one day:

`packages/web/app/views/dashboard/components/TodayBookingsPane.jsx:185`

```jsx
{formatTime(startTime)} - {formatTime(endTime)}
```

For a booking of 12 Aug 10:00am → 14 Aug 11:30am this renders "10:00am -
11:30am" on every day of the stay, which reads as a 90-minute same-day booking.

The pane is one of the few appointment surfaces that hand-rolls its time range.
Everywhere else uses `DateTimeRangeDisplay`
(`packages/ui-components/src/components/DateDisplay/DateDisplay.jsx:311`), which
already drops the date qualifier only when start and end fall on the same day,
or uses `AppointmentTile`, which renders the start time alone plus the overnight
moon icon. Neither the moon icon nor any date appears in the pane.

The booking legitimately appears on each day of the stay: the appointments list
endpoint filters by overlap, not by start date
(`buildTimeQuery`, `packages/facility-server/app/routes/apiv1/appointments.js:108`),
and the pane queries today's facility-timezone day boundaries. So the middle and
last days of the stay are expected rows; only their rendering is wrong.

Two secondary consequences of the same root cause:

- The pane's tooltip carries only location and patient, and the card has no
  click-through, so there is no way to see the real dates from the dashboard.
- Rows are ordered by `startTime`, so a booking that began days ago sorts above
  today's bookings rather than at its position in today's timeline.

## Notes

- Multi-day detection elsewhere (`DateTimeRangeDisplay`, `AppointmentTile`,
  `PastBookingsModal`) compares the stored primary-timezone strings rather than
  the facility-timezone values, so it can be off by a day boundary where a
  facility timezone differs from the primary timezone. Out of scope for this
  card, but the fix here should compare facility-timezone values.
- `TodayBookingsPane` destructures `getDayBoundaries()` directly while
  `TodayAppointmentsPane` guards with `boundaries?.start`; the helper is typed as
  nullable.
