# Y5 — Bookings status indicators

Simplify how the dashboard **Today's bookings** pane displays an overnight (multi-day) booking, so its
time column is a single line and every row's status dot and card line up. Design owns the display; the
three scenarios below are exact from Flic (Figma "Tamanu Desktop 1", nodes 42141-107929 / 42141-107976 /
42143-108520). Mockup: **Today's bookings status indicators**.

This builds on L3, which fixed the *wrong times* on overnight bookings by dating both ends and adding an
overnight icon. Y5 keeps L3 correct everywhere else but replaces that treatment **in the dashboard pane
only** with a lighter snapshot.

## The rule

Only the time column changes. Everything else in the pane (title, "View all…", rail + dots, card tint,
location + patient text) is unchanged.

**Each end of the range is displayed independently: an end falling on today shows as just its time, an
end falling on any other day shows as just its date.** Nothing else is shown — no today's date, no
second component on either end, and no overnight icon. The pane is a snapshot of one day, so the reader
already knows what today is; a date appearing at either end is itself the signal that the booking
reaches beyond today.

The three designs are this rule applied to a booking that starts today:

- **Single regular booking** — both ends today: `8:00am – 9:00am`.
- **Overnight booking** — start today, end elsewhere: `8:00am – 12 Aug`.
- **Very small screen** — the same content flows onto two lines, pieces stay horizontally centred
  (`8:00am –` / `12 Aug`).

Applied to the other days a multi-day booking covers (12 Aug 10:00am → 14 Aug 11:30am, as in L3):

| Viewed on | Start end | End end | Renders |
|---|---|---|---|
| 12 Aug (first day) | today → time | 14 Aug → date | `10:00am – 14 Aug` |
| 13 Aug (mid-stay) | 12 Aug → date | 14 Aug → date | `12 Aug – 14 Aug` |
| 14 Aug (last day) | 12 Aug → date | today → time | `12 Aug – 11:30am` |

Every day of the stay reads as a distinct, unambiguous statement of the span, and the row is one line
throughout. This is the property L3 was reaching for, achieved by showing *less* rather than more.

## Behaviour rules

- Date format is day and month (`12 Aug`) — the `dayMonth` format, as L3 established.
- A booking with no end time shows its start alone; its start is necessarily today, so a single time.
- No overnight icon anywhere in this pane.
- Time cell is centred so a wrap on a narrow pane keeps both parts centred rather than left-ragged.
- All rows are now single-line, so overnight rows are the same height as same-day rows — this is the
  alignment fix the card is really about.

## Implementation approach

Change is confined to `packages/web/app/views/dashboard/components/TodayBookingsPane.jsx`.

- **Do not reuse the shared L3 primitives here.** `useDateRangeSpan` / `RangeEndDisplay`
  (`packages/ui-components/src/components/DateDisplay/DateDisplay.jsx`) encode the both-ends-dated +
  icon treatment that the other appointment surfaces still want. Y5's dashboard shape is a different
  rule, not a variant of that one: `useDateRangeSpan` answers "does this range span days, and which ends
  need a date *alongside* their time", whereas Y5 asks, per end, "is this end today — time, or not today
  — date, exclusively". Reusing it would mean threading flags through a shared component to invert its
  premise. Build a small **view-local** helper/component for the dashboard time cell and leave the shared
  primitives untouched.
  - The dashboard is the **only** consumer of `useDateRangeSpan` / `RangeEndDisplay`
    (`DateTimeRangeDisplay` is what the other surfaces use), so this change is safely scoped to the pane.
  - Reuse the leaf display atoms — `TimeDisplay` for a today end, `DateDisplay format="dayMonth"` for a
    non-today end, each wrapped in `<bdi>` for RTL safety exactly as `RangeEndDisplay` does. It's the
    *composition* that's view-local, not the atoms.
  - The per-end predicate is `trimToDate(toFacilityDateTime(end)) === today` — the same day-comparison
    `useDateRangeSpan` does internally, and it must stay in the **display** timezone (a booking can sit
    within one day in the primary timezone and straddle midnight in the facility's). `today` is already
    passed into the row as `getCurrentDate()`.
  - `spansMultipleDays` is no longer needed by the pane at all — each end decides for itself.
- Keep the whole time cell as its own component so the per-end decision is stated once and applied to
  both ends, rather than branching on booking shape.
- Centre the time cell (flex, `justify-content: center`, `flex-wrap: wrap`) so the very-small-screen wrap
  stays centred. Drop the current `RangeLine` two-line-per-end structure — every row is one logical line
  now.
- **The grid time-track floor needs rethinking, not just retuning.** It is currently
  `minmax(15ch, max-content)`; a `ch` floor that large means the track can never shrink below the content,
  so the wrap the design asks for on small screens can't happen — the pane instead crushes the card,
  which is the wrong thing to sacrifice (confirmed while building the mockup: Design's third panel keeps
  the card's location and patient fully readable).
  - What works is letting the track fall to **`min-content`** on a narrow pane. With each end marked
    nowrap, min-content is the wider of the two ends, so the range wraps to two centred lines and the
    card keeps its width. Widest Y5 string is around `10:00am – 11:30am` (~17ch).
  - Verify the single line still holds comfortably at the pane's 366px min-width and that the wrap only
    engages on genuinely narrow panes.
- Remove the now-unused `Brightness2Icon` import / `OvernightIcon` styled component from the pane.
- Preserve the rail/dot layout and the `3lh` card min-height exactly (see L3 notes baked into the file's
  comments — the lead-connector height is load-bearing for scroll overflow).

## Spec impact

`specs/scheduling/overview.md` (id: SCHEDULING) currently states, generically, that a multi-day booking
carries a date at **both** ends "wherever it is listed" and is "marked with an overnight indicator …
including in lists compact enough to show only its times." Those two clauses describe the L3 **dashboard**
treatment that Y5 replaces. The spec needs to separate:

- **General range display** (appointment detail, cancel modals, past bookings, location bookings table —
  the `DateTimeRangeDisplay` consumers): keep both-ends-dated behaviour.
- **Today's bookings dashboard snapshot**: overnight bookings show start time then end date, no end time
  and no overnight icon, on a single line that may wrap centred on very small screens.

Draft this spec edit as part of implementation (behavioural change, so the spec leads the code).

## Tests

`packages/web/__tests__/views/dashboard/TodayBookingsPane.test.jsx` currently asserts the L3 output for
this pane and will need rewriting to the Y5 shape. Its existing fixtures already cover the right days —
`OVERNIGHT_BOOKING` is 12 Aug 10:00am → 14 Aug 11:30am and the suite renders it on each of 12, 13 and
14 Aug — so the cases carry over with new expectations:

- First day of the stay → `10:00am – 14 Aug`; mid-stay → `12 Aug – 14 Aug`; last day → `12 Aug – 11:30am`.
- The existing "states the same span on every day" test inverts: each day now states the span
  *differently* but unambiguously. Replace it with a test that no day renders two bare times (the L3
  `10:00am – 11:30am` misreading) — that assertion is still exactly the regression worth holding.
- No `overnighticon-*` in the pane anymore.
- Same-day row unchanged (`8:30am – 9:00am`); open-ended booking unchanged (single time).
- Rail-into-every-dot assertions still hold.
- Worth adding: an end at midnight, and a booking whose ends straddle midnight only in the facility
  timezone, to hold the display-timezone comparison.

## Checklist

- [ ] Update `specs/scheduling/overview.md` to split general vs dashboard-snapshot behaviour
- [ ] Add view-local time-cell component in `TodayBookingsPane.jsx`; drop overnight icon + `RangeLine`
- [ ] Centre the time cell and let it wrap on narrow panes
- [ ] Retune the grid time-track floor for the shorter strings
- [ ] Rewrite `TodayBookingsPane.test.jsx` to the Y5 shape
- [ ] Verify unit tests + lint locally
