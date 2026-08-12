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

## The fix

Locked in. Mocked up in "Today's bookings overnight times", rendered on the first,
middle and last day of the stay, each alongside a same-day booking.

- The date appears on whichever end of the range does not fall on today, formatted
  day-month. A booking wholly within today keeps the times it shows now, so the
  common case is untouched.
- The range wraps to two lines, with the overnight icon closing the second line.
- The list is laid out as one grid so every card starts at the same place.

Alternatives considered and rejected: start time alone with the icon (no end time
anywhere); `DateTimeRangeDisplay` unchanged, with or without a wider column (needs
roughly twice the column it has, and date-qualifies every same-day row, because the
component always renders the start date); `dateFormat="shortest"` over two lines
(two lines on every row); the same fix on one line (truncates the location on the
card); clamping the times to today's boundaries (shows boundary times the booking
does not have).

### No fixed width, and no per-row width either

Dates and times are `Intl`-formatted against the `dateTimeLocale` global setting,
which accepts any BCP-47 locale and falls back to each user's browser locale when
unset. Only the separators are hardcoded. So the width of a range is not a property
of the design, it's a property of whoever is looking at it. Measured at 14px, the
same range that is 125px in en-AU is 148px in es-ES ("10:00a. m. - 11:30a. m.") and
139px in ja-JP ("午前10:00 - 午前11:30"). `formatTime` forces `hour12: true`, so
24-hour locales carry a localised am/pm marker rather than getting shorter.

The column is 122px with no clipping rule, so **the current pane already overflows
into the card in those locales**, overnight or not. Sizing each row to its own
content fixes the clipping but leaves the card edges ragged, which is worse to read
than the clipping was.

So the list becomes one grid and each row a `subgrid` of it:

```
grid-template-columns: auto minmax(122px, auto) 1fr;   /* separator | time | card */
```

The time track is then as wide as the widest row and no wider, every card starts at
the same place, and the whole list resizes together when a locale needs more room.
`minmax` keeps today's 122px as the floor so nothing moves in the common case.
Subgrid is Chrome 117 and up; the web bundle targets the last three Chrome majors
and the default browser policy is Chromium-family, so it is comfortably in range.
This means overriding MUI's flex layout on `Timeline`, `TimelineItem` and
`TimelineContent`.

### Right-to-left is broken today, in a way worth fixing here

An Arabic-script month name turns the digits that follow it into an Arabic number
under the bidi algorithm, so the time joins the month's right-to-left run and
renders to its left, stranding the am/pm marker on the far side. In Urdu,
"14 اگست 11:30am" comes out as "14 11:30 اگستam". This is the date column as it
stands, in every right-to-left locale, overnight or not.

Two things fix it, and the mockup shows both:

- Wrap each formatted part in a `bdi` so the runs cannot merge. Keeps the order
  correct even in a left-to-right pane, and is cheap enough to apply wherever a
  date is rendered.
- Set the pane's direction from the locale. The setting already carries what is
  needed: `new Intl.Locale(locale).getTextInfo().direction` returns `rtl` for
  ur-PK, ur-IN, ar-EG and he-IL, `ltr` for en-AU and ja-JP. Note that Chrome
  exposes `getTextInfo()`, not the older `textInfo` getter.

Both together is the only combination that reads correctly to an Urdu speaker: the
grid mirrors, the dot and connector move to the right, and the dash and icon land
at the visual end of their lines.

### Units

The pane is written almost entirely in `px`, which is what made every earlier
sizing answer a guess. Each magic number has a unit that states what it actually
means, and today's values map onto them cleanly, so this is a rewrite in place
rather than a redesign. Measured at the pane's 14px / 18px: `1ch` is 8px, `1em` is
14px, `1rem` is 16px, `1lh` is 18px.

| Was | Becomes | Why |
| --- | --- | --- |
| `width: 122px` on the time column | `minmax(15ch, auto)` grid track | A digit count, not a pixel count. Tracks the font, and `auto` handles anything wider |
| `height: 54px` on the card | `min-block-size: 3lh` | Exactly today's height, expressed as lines of text, so it grows instead of clipping |
| `min-height: 60px` on the row | `min-block-size: 3.75rem` | Vertical rhythm, not a text measure, so `rem` rather than `lh` |
| `min-width: 366px` on the pane | `22.875rem` | Grows with the reader's font-size preference instead of holding still while the text grows |
| `15px` / `20px` / `12px` insets | `rem` | Same reason |
| Overnight icon at 13px | `1em` | Removes the question of which pixel size pairs with 14px text |

`rem` is already the idiom here (629 uses across `web` and `ui-components`), and
there is a `block-size: 3lh` precedent in `RecentlyViewedPatientsList`. `ch` and
`lh` are both far inside the Chrome 149 floor this app targets.

**Logical properties matter more than the units.** The pane uses
`padding-left: 12px`, `padding-right: 20px` and `padding-left: 6px`. Under
`dir="rtl"` those stay on the physical left and right, so the mirrored pane gets
its insets on the wrong sides. `padding-inline` and friends fix it, and the
codebase already uses them heavily (94 `padding-inline`, 60 `block-size`, 61
`inline-size`). The mockup was converted and the RTL pane visibly corrected.

Not worth reaching for: container query units (subgrid already sizes from content,
so a container query buys nothing), `clamp()` (the single `minmax` is the whole
constraint), `%`, viewport units, and `ex` / `cap` / `ic`.

### Other constraints the mockup surfaced

- Suppressing a date that falls on today is a change to `DateTimeRangeDisplay`, and
  would want to apply wherever a range is shown against a known day.
- `StyledTimeline` budgets `60px` per row in its `max-height`, so the two-line row
  needs that budget raised or the list starts scrolling.
- The time column is `text-transform: lowercase`, so a day-month date renders
  "12 aug" until the lowercasing is scoped to the times.
- The overnight icon has to sit in a nowrap span with the text beside it, or it
  wraps onto a line of its own.

## Notes

- Multi-day detection elsewhere (`DateTimeRangeDisplay`, `AppointmentTile`,
  `PastBookingsModal`) compares the stored primary-timezone strings rather than
  the facility-timezone values, so it can be off by a day boundary where a
  facility timezone differs from the primary timezone. Out of scope for this
  card, but the fix here should compare facility-timezone values.
- `TodayBookingsPane` destructures `getDayBoundaries()` directly while
  `TodayAppointmentsPane` guards with `boundaries?.start`; the helper is typed as
  nullable.
