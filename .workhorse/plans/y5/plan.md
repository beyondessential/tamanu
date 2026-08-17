# Y5 — Bookings status indicators

Simplify how the dashboard **Today's bookings** pane displays an overnight (multi-day) booking, so its
time column is a single line and every row's status dot and card line up. Design owns the display; the
three scenarios below are exact from Flic (Figma "Tamanu Desktop 1", nodes 42141-107929 / 42141-107976 /
42143-108520). Mockup: **Today's bookings status indicators**.

This builds on L3, which fixed the *wrong times* on overnight bookings by dating both ends and adding an
overnight icon. Y5 keeps L3 correct everywhere else but replaces that treatment **in the dashboard pane
only** with a lighter snapshot.

## The design (exact)

Only the time column changes. Everything else in the pane (title, "View all…", rail + dots, card tint,
location + patient text) is unchanged.

- **Single regular booking** — start time – end time, e.g. `8:00am – 9:00am`. One line. (Unchanged.)
- **Overnight booking** — start **time** – end **date**, e.g. `8:00am – 12 Aug`. One line.
  - No today's date, no end time, no overnight icon. The end *date* is itself the signal that the booking
    is overnight ("showing the end date implies overnight").
- **Very small screen** — the same content may flow onto two lines, but the pieces stay horizontally
  centred (`8:00am –` / `12 Aug`).

## Behaviour rules

- Same-day booking: two times, no date, no icon (as today).
- Overnight booking: start time then end date; drop the end time and the `Brightness2` overnight icon.
- No end time at all (open-ended booking): single start time, as today.
- Time cell is centred so a wrap on a narrow pane keeps both parts centred rather than left-ragged.
- All rows are now single-line, so overnight rows are the same height as same-day rows — this is the
  alignment fix the card is really about.

## Open question for Design (snapshots don't cover it)

The three snapshots all show a booking that **starts today**. The dashboard also lists a multi-day
booking on the *middle* and *last* days it covers (this is exactly the L3 scenario: a 12 Aug → 14 Aug
stay shows on 13 and 14 Aug too). The design doesn't say what the start shows on those days.

Recommended default (pending confirmation): show the booking's **actual** start time and **actual** end
date on every day it covers — e.g. `10:00am – 14 Aug` on all of 12/13/14 Aug. It's consistent, and the
end date still communicates the span. The alternative (showing only the portion that falls on the viewed
day) reintroduces the ambiguity L3 removed. **Confirm with Flic before finalising.**

## Implementation approach

Change is confined to `packages/web/app/views/dashboard/components/TodayBookingsPane.jsx`.

- **Do not reuse the shared L3 primitives here.** `useDateRangeSpan` / `RangeEndDisplay`
  (`packages/ui-components/src/components/DateDisplay/DateDisplay.jsx`) encode the both-ends-dated +
  icon treatment that the other appointment surfaces still want. Y5's dashboard shape (time → date, no
  icon, centred, wrap-on-narrow) is different enough that reuse would mean threading flags through a
  shared component. Build a small **view-local** component/helper for the dashboard time cell instead,
  and leave the shared primitives untouched.
  - The dashboard is the **only** consumer of `useDateRangeSpan` / `RangeEndDisplay`
    (`DateTimeRangeDisplay` is what the other surfaces use), so this change is safely scoped to the pane.
  - Reuse the leaf display atoms — `TimeDisplay` for the time, `DateDisplay format="dayMonth"` for the
    end date, wrapped in `<bdi>` for RTL safety exactly as `RangeEndDisplay` does. It's the *composition*
    (`spansMultipleDays → time + dayMonth date`, no icon) that's view-local, not the atoms.
- Keep the whole time cell as its own component so start-of-current-day vs multi-day is one clear
  decision, and it reads as a snapshot rather than a range.
- Centre the time cell (flex, `justify-content: center`, `flex-wrap: wrap`) so the very-small-screen wrap
  stays centred. Drop the current `RangeLine` two-line-per-end structure — every row is one logical line
  now.
- The grid time-track floor (`minmax(15ch, max-content)`) was sized for the widest L3 string
  (`12 Aug 10:00am –`). The widest Y5 string is `8:00am – 12 Aug`, so the floor can come down; measure and
  set it so the single-line case never wraps at 366px and the wrap only kicks in on genuinely small panes.
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
this pane and will need rewriting to the Y5 shape:

- Overnight row renders one line `8:00am – 12 Aug` (start time, end date), on every day the stay covers.
- No `overnighticon-*` in the pane anymore.
- Same-day row unchanged (`8:30am – 9:00am`); open-ended booking unchanged (single time).
- Rail-into-every-dot assertions still hold.

## Checklist

- [ ] Confirm mid-stay display with Design (open question above)
- [ ] Update `specs/scheduling/overview.md` to split general vs dashboard-snapshot behaviour
- [ ] Add view-local time-cell component in `TodayBookingsPane.jsx`; drop overnight icon + `RangeLine`
- [ ] Centre the time cell and let it wrap on narrow panes
- [ ] Retune the grid time-track floor for the shorter strings
- [ ] Rewrite `TodayBookingsPane.test.jsx` to the Y5 shape
- [ ] Verify unit tests + lint locally
