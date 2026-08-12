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

| Option | Shape | Cost |
| --- | --- | --- |
| A. Start time and overnight icon | one line, one time | No end time at all; last day leads with a time that isn't today |
| B. `DateTimeRangeDisplay` as-is | one line, both dates | Roughly twice the column it has; dates on same-day rows |
| C. `DateTimeRangeDisplay`, column widened | one line, both dates | Pane grows by about half; dates on same-day rows |
| D. `dateFormat="shortest"`, two lines | two lines, both dates | Two lines on every row; dates on same-day rows |
| E. Drop dates falling on today, day-month for the rest | one line | Card truncates the location |
| F. As E, wrapped to two lines, icon ending line two | two lines | Two lines on overnight rows only |
| F2. As F, icon in place of the range dash | two lines | No explicit separator between the two times |
| G. Clamp to today's boundaries | one line | Shows boundary times the booking doesn't have |

### The time column cannot carry a fixed width

Dates and times are `Intl`-formatted against the `dateTimeLocale` global setting,
which accepts any BCP-47 locale and falls back to each user's browser locale when
unset. Only the separators are hardcoded. So the width of a range is not a
property of the design, it's a property of whoever is looking at it.

Measured at 14px, the same range that is 125px in en-AU is 148px in es-ES
("10:00a. m. - 11:30a. m.") and 139px in ja-JP ("午前10:00 - 午前11:30"). Note that
`formatTime` forces `hour12: true`, so 24-hour locales still carry a localised
am/pm marker rather than getting shorter.

The column is 122px with no clipping rule, which means **the current pane already
overflows into the card in those locales**, overnight or not. That is a separate
defect from this card's, in the same six lines of code, and any option chosen here
should fix it rather than re-budget it.

The robust treatment is to stop budgeting: size the time column to its content
(`width: max-content`) with the present 122px as a `min-width` floor. Cards stay
aligned on the common case, the column grows only where a locale needs it, and the
card absorbs the difference through the ellipsis it already has. Options F and F2
are mocked up this way, including a five-locale spread.

Other constraints the mockup surfaced:

- `DateTimeRangeDisplay` always renders the start date, so options B, C and D
  date-qualify every same-day row too. Suppressing a date that falls on today
  (E, F) is a change to the shared component, and would want to apply wherever
  the range is shown against a known day.
- `StyledTimeline` budgets `60px` per row in its `max-height`, so any two-line
  option needs that budget raised or the list starts scrolling.
- The time column is `text-transform: lowercase`, so a day-month date renders
  "12 aug" until the lowercasing is scoped to the times.
- The overnight icon has to sit in a nowrap span with the text beside it, or it
  wraps onto a line of its own.
- Right-to-left locales get Arabic-Indic digits and mirrored order from `Intl`,
  which the pane's fixed left-to-right row does not account for. Out of scope
  here, but a fixed-width column would compound it.

## Notes

- Multi-day detection elsewhere (`DateTimeRangeDisplay`, `AppointmentTile`,
  `PastBookingsModal`) compares the stored primary-timezone strings rather than
  the facility-timezone values, so it can be off by a day boundary where a
  facility timezone differs from the primary timezone. Out of scope for this
  card, but the fix here should compare facility-timezone values.
- `TodayBookingsPane` destructures `getDayBoundaries()` directly while
  `TodayAppointmentsPane` guards with `boundaries?.start`; the helper is typed as
  nullable.
