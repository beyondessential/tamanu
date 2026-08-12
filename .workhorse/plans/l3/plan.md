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

## Display options

Mocked up in "Today's bookings overnight time options", all seven rendered on the
first, middle and last day of the stay, each alongside a same-day booking.

| Option | Time column | Cost |
| --- | --- | --- |
| A. Start time and overnight icon | 122px | No end time at all; last day leads with a time that isn't today |
| B. `DateTimeRangeDisplay` as-is | needs ~280px | Doesn't fit; dates on same-day rows |
| C. `DateTimeRangeDisplay`, column widened | ~280px, pane 530px | Pane 45% wider; dates on same-day rows |
| D. `dateFormat="shortest"`, two lines | 136px | Two lines on every row; dates on same-day rows |
| E. Drop dates falling on today, day-month for the rest | 200px | Card truncates the location |
| F. As E, wrapped to two lines, icon ending line two | 130px | Two lines on overnight rows only |
| F2. As F, icon in place of the range dash | 130px | No explicit separator between the two times |
| G. Clamp to today's boundaries | 122px | Shows boundary times the booking doesn't have |

Constraints the mockup surfaced:

- `DateTimeRangeDisplay` always renders the start date, so options B, C and D
  date-qualify every same-day row too. Suppressing a date that falls on today
  (E, F) is a change to the shared component, and would want to apply wherever
  the range is shown against a known day.
- `StyledTimeline` budgets `60px` per row in its `max-height`, so any two-line
  option needs that budget raised or the list starts scrolling.
- The time column is `text-transform: lowercase`, so a day-month date renders
  "12 aug" until the lowercasing is scoped to the times.
- The overnight icon has to be in a nowrap span with the text it sits beside, or
  it wraps onto a third line of its own. At the pane's icon scale (13px, matching
  the status indicator) the column needs 130px.

## Notes

- Multi-day detection elsewhere (`DateTimeRangeDisplay`, `AppointmentTile`,
  `PastBookingsModal`) compares the stored primary-timezone strings rather than
  the facility-timezone values, so it can be off by a day boundary where a
  facility timezone differs from the primary timezone. Out of scope for this
  card, but the fix here should compare facility-timezone values.
- `TodayBookingsPane` destructures `getDayBoundaries()` directly while
  `TodayAppointmentsPane` guards with `boundaries?.start`; the helper is typed as
  nullable.
