# Y5 — Bookings status indicators

Simplify the dashboard **Today's bookings** pane: show less about an overnight (multi-day) booking so
its time column is a single line and every row's dot and card line up, and drop the rail when there is
only one booking. Design owns the display; the scenarios below are exact from Flic (Figma "Tamanu
Desktop 1", nodes 42141-107929 / 42141-107976 / 42143-108520). Mockup: **Today's bookings status
indicators**.

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

## The rail

**The rail spans the dots and nothing more.** It begins at the first dot and ends at the last, with no
lead-in above the first and no run-out below the last. It is what connects the dots, so it exists only
where there are dots to connect — which is also why **a pane listing exactly one booking draws no rail
at all**, just the status dot. One rule, and the single-booking case falls out of it.

⚠️ **This reverses both of L3's rail decisions, so don't let either get "fixed" back.** L3 deliberately
ran the rail *above* the first dot — see the `LeadConnector` doc comment ("A lone dot with nothing
running into it reads as misplaced rather than as the first of a list") — and then deliberately ran it
*past* the last dot in commit `24a79b3080` ("run the bookings rail out of the last dot, not just into
it"), which is what the `&:last-child … flex: 0 0 12px` rule in the file exists for. Design has since
looked at the pane and wants the rail contained to the dots. Both the `LeadConnector` rationale and the
last-child rule go; replace the old reasoning in the component's comments rather than leaving it
alongside the new behaviour.

`.row:only-child` (rows are direct children of the timeline grid) expresses this in CSS with no extra
component state, which is what the mockup does.

## Layout: remove the positioning hacks rather than preserve them

The 21px spacer that places the dot, and the "its height is load-bearing, don't touch it" warning around
it, are not inherent to the design — they are fallout from bending MUI v4 lab's `Timeline` into a grid.
Y5 should clear them out, not work around them.

**Drop MUI `Timeline` for plain elements.** The pane wraps all six Timeline parts in styled-components
that cancel essentially everything the library contributes: `Timeline` becomes `display: grid`,
`TimelineItem` becomes a subgrid with MUI's opposite-content `::before` killed by `content: none`,
`TimelineDot` has its padding, margin, background and box-shadow all zeroed out, and `TimelineContent`
its padding. What survives is `div`s. This pane is the **only** `Timeline` consumer in the repo, and
`@material-ui/lab` is the legacy v4 alpha (`^4.0.0-alpha.61`) sitting alongside `@mui/material` v6 — so
there's no consistency argument for keeping it either. Replacing it with semantic elements removes the
`:before` cancellation, the dot de-styling, and the separator's flex column in one go.

**Keep the grid, it is doing real work.** The time column must be one track as wide as the widest row
needs, so every card starts at the same place. That is a cross-row constraint, so the container grid
plus `subgrid` rows is correct and a per-row flex genuinely cannot express it. The grid is not the hack;
the vertical hacks inside it are.

**Place the dot by alignment, not by a spacer.** With the row's content centred, the dot is simply
centred too — `place-items: center` on the dot cell and nothing else. No offset constant, and nothing to
keep in sync with the card's padding or line-height. This is also what makes the dot land *exactly*
where it should: the 21px spacer was placing it a pixel or two high, because a hand-tuned constant can
only ever approximate a value the layout already knows.

**Put the rail in the dot's own grid cell, and let the same centring do both.** Make it a pseudo-element
that shares the dot's grid area (`grid-template-areas: 'dot'`, both items on `dot`), sized
`inline-size: 1px; block-size: 100%` with `justify-self: center; align-self: stretch`. Extent for the
first and last rows is then `block-size: 50%` anchored to the side the next dot is on (`align-self: end`
on the first, `start` on the last), so the rail begins and ends exactly at the dot centres, with
`:only-child { content: none }` for the no-rail case.

⚠️ **Do not centre it with `inset-inline-start: 50%` + `translate: -50%`.** That was the first attempt
and it is what put the rail a pixel right of the dots. Measured at 1× on the rendered mockup: the
translate lands a 1px line on a half pixel, so the renderer smears it across **two** columns (x=29 and
x=30) centred on 29.5 against a dot centre of 30.0 — off *and* blurry. Sharing the dot's cell measures
one crisp column exactly on centre. The general point: centring the dot and the rail by two different
mechanisms means two different roundings, so use one mechanism for both.

This also keeps the safety property that made the pseudo-element attractive. The rail is sized purely as
a percentage of a cell it shares, and has no content, so its intrinsic contribution to the row's height
is zero — it cannot push the row taller than what is drawn. That is precisely the trap in L3's comment
(`flex: 0 0 21px` was a *definite* contribution to the separator's height, so a mis-sized rail left the
row 21px taller than it looked and the overhang became phantom scrollable overflow). Here that class of
bug stops being possible rather than being avoided by convention.

⚠️ One gotcha the mockup surfaced: with a single rail spanning the row, the line passes *behind* the dot,
and the outlined status icons (`CircleIconOutlined`, `CircleIconDashed`) are transparent in the middle,
so it shows through. Give the dot wrapper the pane's white background to mask it — invisible against the
white pane, and it makes the "dot sits on the rail" relationship explicit.

### Scope note

This is a layout rewrite of one component on a **release branch** (`release/2.62`), which is more than a
regression fix strictly needs. Arguments for doing it here anyway: it is confined to a single file with
no other consumers, the component already has unit test coverage, and the alternative is shipping the Y5
changes *through* the hack while carrying a comment warning the next person not to disturb it. Arguments
against: any layout rewrite risks visual regressions a release branch would rather not take. Worth a
call before starting — if the answer is "minimal change", the fallback is the transparent-spacer
approach, which works but leaves the fragility in place.

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
- Worth adding: an end at midnight, and a booking whose ends straddle midnight only in the facility
  timezone, to hold the display-timezone comparison.

⚠️ **`runs the rail into every dot, down to a lone one` must be deleted, not left to pass.** It asserts
that `leadconnector-*` elements are present. Since the lead segment stays in the DOM as a spacer and only
its paint changes, that assertion would keep passing while asserting the opposite of the intended
behaviour — a silently vacuous test, worse than no test. The file's own comment already notes that where
the rail stops "is left to CSS, which this renderer does not apply", so paint is not assertable at this
level. Cover the lone-booking rail visually in the card's test cases instead, or expose the row's
alone-ness as a data attribute if it's worth asserting in the unit test.

## Checklist

- [x] Update `specs/scheduling/overview.md` to split general vs dashboard-snapshot behaviour
- [x] Add view-local time-cell component in `TodayBookingsPane.jsx`; drop overnight icon + `RangeLine`
- [x] Centre the time cell and let it wrap on narrow panes
- [x] Retune the grid time-track floor so the narrow case can actually wrap
- [x] Decide: full layout rewrite vs minimal change (see scope note)
- [x] Replace MUI `Timeline` parts with plain elements
- [x] Centre the dot by alignment; delete the 21px spacer and its warning comment
- [x] Redraw the rail as a pseudo-element in the dot's own grid cell; mask it behind the dot
- [x] Contain the rail to the dots: no lead-in above the first, no run-out below the last
- [x] Hide the rail when the pane lists one booking
- [x] Update the component's comments to the new intent, replacing L3's reasoning
- [x] Rewrite `TodayBookingsPane.test.jsx` to the Y5 shape, deleting the rail-into-lone-dot case
- [x] Verify unit tests + lint locally
- [x] Trim the now-unused `onDate`/`showStartDate`/`showEndDate` from the shared `useDateRangeSpan`
- [ ] Manual visual pass against the mockup (see `.workhorse/test-cases/y5/overview.md`)
