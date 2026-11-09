# QA loop — diet summary sheet (TAM-2141 / F11)

Branch `feat/TAM-2141/diet-summary-sheet`, 32 commits against `main`, straight after a five-round
review loop (`.workhorse/plans/f11/review/log.md`). Rigour assumed standard: cap 8 rounds, two clean
rounds in a row with the second cold. This conversation runs outside Workhorse, so there are no run
tools: rounds and findings are recorded here rather than filed.

## Charter

### User-facing flows

1. **Print the whole facility's sheet.** A ward clerk or kitchen lead opens Bed management with no
   Area applied, selects **Diet summary**, and gets a PDF preview of every patient with an open
   admission, triage, active ED care or emergency short stay encounter at the facility they are
   signed in to, grouped by ward, with ward sub totals and a hospital total, and prints it.
2. **Print one ward.** The same, with an Area applied in the search bar, covering that ward alone.
3. **Be refused.** A user without the four permissions sees the button, opens it, and gets the
   no-permission message with a dismiss action and no print action.
4. **Fail to load.** The request fails; the preview is replaced by a message and printing is not
   offered.

### API surface

`GET /api/dietSummary`, facility server, authenticated. Takes an optional `areaId` in the query;
the facility comes from the session token, never the query. Requires `list Patient`,
`read LocationGroup`, `read Location` and `read Encounter`. Returns `{ columns, hospitalTotals,
areas }`.

### Data and state

Reads `encounters`, `locations`, `location_groups`, `patients`, `encounter_diets` and
`reference_data`. Writes nothing. Reads the setting `bedManagement.dietSummary.regularDietId`,
declared at both the global and facility scopes. Two index migrations:
`encounter_diets_encounter_id` and `locations_facility_id_location_group_id`, both partial on
`WHERE deleted_at IS NULL`.

### Risks, ranked

1. The printed sheet is wrong in a way that is believed — a miscount, a missing patient, a tick
   under the wrong diet. The kitchen cooks from it.
2. A patient is missing from the sheet and goes unfed: a soft-deleted ward or bed, a retired bed,
   an encounter type left out.
3. The sheet is unreadable or truncated under real data: long names, many diets, unicode, a ward
   that runs over a page break.
4. Cross-facility or cross-permission exposure of patient identifiers.
5. The query's cost on a busy facility server.

### Commands

Tests `cd packages/<pkg> && NODE_ENV=test npx vitest run`, lint `npx eslint <files>`, build
`npm run build`, all with node 26 first on PATH (`.node-version`).

## Preflight

**No rig, and therefore no running app.** `workhorse-local rig` builds this commit fine (the build
reaches `ready`), but the `seed` step exits 1 on both this branch AND on `main`
(`0f623d2ce6`) — identical failure, so it is environmental and not the branch's doing. The recipe's
own notes say `provision` fetches three programs from S3 and that seeding needs the network, which
is the most likely cause on this machine. Evidence kept at `scratchpad/lease.log` and
`scratchpad/lease-main.log`.

Consequences, carried into the final report:

- **Every browser check is NOT VERIFIED.** Flows 1–4 above cannot be driven end to end, so nothing
  is claimed about the button, the modal, focus, keyboard or the live print action.
- **Live API probing is NOT VERIFIED** against a running server. The endpoint is instead exercised
  through its own integration harness, which runs a real Express app and a real database — that is
  genuine execution, not tracing, but it is not a black-box probe of a deployed server.
- **The printed sheet IS verifiable**, by rendering the react-pdf document headlessly and reading
  the pages. That is the artefact the kitchen actually uses, so the most consequential surface is
  checked for real.

Rigs and disk: free 225.9 GB, 0 leases, 1 build (1.4 GB) against a 10 GB card budget, rig memory 0.

## Baseline

From the review loop's closing checkpoint, on this branch: lint clean; diet summary endpoint tests
30 passing; settings 97; shared 226; web unit 747; build passing. The full facility-server suite has
16 failures, all shown not to be this branch's: 14 verified identical on `main`, two mSupply files
failing from this machine's `config/local.json5` overriding `serverFacilityIds`, and one flaky
`EncounterInvoice` case that did not reproduce over three seeded runs.

## Findings ledger

| id | round | severity | kind | status | commit | test |
|---|---|---|---|---|---|---|

## Round 1

Six lenses, all able to genuinely execute despite there being no running app:

| Lens | Model | How it executes |
|---|---|---|
| Edge cases | sonnet | real tests through the integration harness, in a throwaway probe file |
| Security | opus | the same harness, attacking the scoping, the settings read and the permission edges |
| Test audit | sonnet | mutation testing the route, one change at a time, restoring after each |
| Neighbours | sonnet | the neighbours' own suites, and the callers of every shared file the branch touched |
| Printed sheet | sonnet | rendering the document headlessly under hostile data and reading every page |
| Architecture | fable | read-only, once per run |

The browser lenses — flows 1 to 4, keyboard, focus, the live print action — cannot run and are
recorded as not verified.

### Architecture (fable) — 0 blocker, 0 high, 1 medium, 4 low

- ARCH-1 (medium) the four display rules — translated labels, `null` name meaning Regular,
  regular-first and No-area-last ordering — live only inside `DietSummaryPDF.jsx`, where nothing can
  test them and no second consumer can reach them. → FIX ON THIS BRANCH. It is the same gap the
  review loop recorded as a follow-up awaiting a harness: lifting the rules into a pure helper is
  that harness, and turns the one unpinned spec criterion into a tested one.
- ARCH-2 (low) the response carries orderings the PDF discards, with nothing saying which is
  authoritative. → cheap, fix here.
- ARCH-3 (low) bed names are exempt from the translate-and-sort rule without saying why. → cheap,
  fix here.
- ARCH-4 (low) a second right-aligned bed management letterhead beside `HandoverHeaderSection`.
  → follow-up card, as the review loop already decided.
- ARCH-5 (low) the grouping and counting are bound to `req`, so a scheduled print would need an
  extraction. → follow-up when something needs it.
- Examined and sound: `isRegular` against `name === null` being two facts rather than one, the
  two-scope setting sharing one leaf, the counting rules living in one place, and the
  button-owns-its-modal shape.

### Edge cases (sonnet) — 0 blocker, 0 high, 2 medium, 1 low. All RAN.

- F1 (medium, bug) two simultaneous open encounters for one patient produce two rows and are
  double-counted in the sub total and the hospital total, because the grouping keys by encounter
  rather than patient. Worth noting that the review loop's bugs lens examined this very case and
  ruled it out by reasoning, on the strength of the check-then-create guard in `encounter.js`; the
  adversary ran it and it double-counts whenever the state exists. There is no database constraint
  and the sync path is not guarded. → DECISION FOR THE AUTHOR, not changed: the state is invalid,
  and a sheet showing the patient in two beds arguably surfaces that to the ward, where silently
  deduping would hide it. What is not in doubt is that the totals mislead the kitchen on quantity.
- F2 (medium, bug) the `location_groups` join carries no facility check, so a bed whose ward record
  belongs to a different facility prints that foreign ward's name on this facility's sheet. RAN.
  → fix now; the condition is one line and strictly correct either way.
- F3 (low, edge) the setting accepts an empty string, which `??` treats as configured, producing a
  column keyed on `''`. No visible difference on the sheet, since a null name already prints as
  Regular. → fix now.
- Ran clean: natural ordering, the literal `regular` id collision, oversized input, unicode and
  text edges, cross-facility `areaId`, and same-name collisions.

### Test audit (sonnet) — 1 medium. 17 mutations run, 16 killed, 1 survived.

- F4 (medium, coverage) corrupting ONLY `subTotals` — every ward's sub total set to the facility
  wide counts, with `hospitalTotals` left correct — fails none of the 30 tests. The spec says a
  ward's Sub total counts the patients in that ward, so a regression leaking one ward's counts into
  another's would ship, and the sheet would carry wrong per-ward kitchen numbers under a Hospital
  total row that still looked right. Root cause: every test asserting `subTotals` uses a single
  ward, where the ward's patients and all patients are the same list, and every multi-ward test
  asserts only `hospitalTotals`, `columns`, names and patients. → fix now, with a two-ward test
  asserting both wards' sub totals and the hospital total together.
- The other 16 mutations were each killed, including dropping an encounter type, every
  `deleted_at` filter, the `type = 'diet'` predicate, the dedupe, the area filter, the regular
  column's position, `isRegular`, the facility scoping and a permission check.
- No order dependence over three shuffled runs.

### Security (opus) — 0 blocker, 0 high, 2 medium, 1 low. Exercised against a real Express app.

- DS-1 (medium) `req.settings[facilityId]` is unguarded, so a session whose facility this server
  does not host 500s and returns the raw TypeError text. Reachable because `allowedFacilities()`
  can return `CAN_ACCESS_ALL_FACILITIES`, so a token can carry a facility this server does not
  serve. The review loop's round 2 raised this shape and I believed taking the facility from the
  session had closed it; it had not. → fix now, failing closed with a clean error.
- DS-2 (medium) the totals accumulate on a plain `{}` keyed by reference data ids, so a diet whose
  id is a prototype key corrupts the printed counts. Reference data ids are admin-supplied, so this
  is reachable without any compromise. → fix now, with a null-prototype object or a Map.
- DS-3 (low) the area join is not constrained to the caller's facility, so a mis-assigned bed
  prints another facility's ward name as a heading. SAME FINDING as the edge lens's F2, found
  independently. Merged; fixed once.
- Checked and clean: the `areaId` scoping against injection and as an oracle, the permission
  boundaries including a role holding three of four, and the error paths for leakage beyond DS-1.

Security's detail, confirmed RAN: `POST /api/setFacility` issues a token for any facility the USER
can access, which by default is all of them, not merely the ones this server hosts — so an ordinary
clinician can make the endpoint 500 with the raw message surviving into production. And a diet whose
id is `constructor` or `toString` passes `SAFE_ID_REGEX`, so it is reachable through both the
importer and the Manage tab: the sheet then prints `function Object() { [native code] }1` where a
count belongs, while an id of `__proto__` silently drops that patient from every total while still
listing them on the sheet — a patient on the page who is not in the kitchen's numbers.

It attacked and found clean: 21 hostile `areaId` values including SQL fragments, NUL bytes, unicode
lookalikes, qs array and object forms and a 2 MB value — all answered 200-empty or 422 with no
database error and no existence oracle; cross-facility `areaId`; and the permission gate against
wrong-verb, wrong-noun, `list all` and `read all`.

A duplicate Regular column is reachable when a deployment leaves the setting unset while shipping
its own diet of that name — two columns with the same heading. WON'T FIX: the spec's Configuration
note already anticipates exactly this and names pointing the setting at that diet as the remedy, and
the counts themselves are right.

### Printed sheet under hostile data (sonnet) — 1 blocker, 4 high, 1 medium, 3 low. 23 pages read.

- P1 (blocker) non-Latin names are corrupted under the default font, and the Māori case is the
  dangerous one: "Mārama Te Wānanga-ā-Rangi" prints as "Mrama Te Wnanga--Rangi", a plausible but
  WRONG name with no visual cue. Arabic and Thai become Latin mojibake that reads as an odd name
  rather than as an error; Chinese collapses to a single stray character; emoji vanish. Turning on
  `features.useGlobalPdfFont` fixes Arabic and macrons but turns Chinese and Thai into tofu boxes,
  so no single configuration covers them, and the default is off. I looked at the page myself.
  NOT FIXABLE ON THIS CARD: the font stack lives in `pdf/languageContext.jsx` and
  `pdf/registerFonts.js` and is shared by every PDF Tamanu prints, so changing it is a platform
  decision about font coverage, licensing and bundle size. → ESCALATED to the author as the most
  important thing in this report. Palau is the target deployment and Pacific names carry macrons.
- P2 (high) a ward can print "(continued)" on its own first page of content, with its heading
  stranded alone at the foot of the page before it. Reproduced at 40 wards and again in a second
  fixture. This is the react-pdf two-pass fragility the review loop flagged and I accepted with a
  comment; running it at volume proved it breaks. → fix now.
- P3 (high) a column with a null name is labelled "Regular" even when it is not the regular column,
  because the fallback keys off the name rather than `isRegular` — a real diet hidden behind a
  bogus Regular heading. Not reachable from today's route. → fix now; it is two lines and the
  consequence in a kitchen is bad.
- P4 (medium) REJECTED: it claimed beds are not in natural order, having fed the component a
  lexicographic ordering. `locations.name` carries `COLLATE public.en_numeric` in the baseline
  schema — I checked again — so the database never produces that order, and three other agents
  verified the natural ordering empirically. The reviewer traced rather than ran this one.
- P5 (high) totals are trusted rather than derived from the rows. Its own suggested fix says none
  is required while both come from one pass over the same data, which is the case. WON'T FIX.
- P6 (high) a patient with no diet keys prints a blank row. Unreachable: the route always falls
  back to the regular key, and there are tests for it. WON'T FIX — a defensive branch in internal
  code is what the coding rules call a smell.
- P7, P8, P9 (low) long diet names wrap mid-word, three-digit bed numbers wrap in the Bed column,
  an empty bed string prints blank. Cosmetic, nothing lost. WON'T FIX.

### Neighbours (sonnet) — 1 medium, 1 low, two surfaces clean.

- N1 (medium, TRACED) the `printPDF` guard this branch added turns a thrown error into a silent
  no-op for all 23 print callers in the app, in exactly the race the branch acknowledges. ACCEPTED
  with reason rather than fixed: before the guard a click in that window threw an uncaught
  TypeError, and after it the click does nothing — neither prints, and the guard removes a crash
  from a shared helper. Giving print a real ready-state is the proper fix and belongs to
  `PDFLoader`, as a follow-up. 
- N2 (low, NOT VERIFIED) the search bar now packs two labelled print buttons into the grid cell
  that held one, which may crowd or wrap. No browser on this machine, so it stays unverified and is
  called out in the report as something to look at on screen.
- Clean: no settings key collision (the pre-existing `bedManagement` leaf sits at a deeper path),
  both migrations uniquely named and owed no dbt or mobile counterpart, every `data-testid`, icon
  colour, disabled state and tooltip carried over, and the neighbouring suites plus the full web
  suite pass.

**A process lesson, mine.** This adversary chased a wave of non-reproducible test failures that
turned out to be my own fixers committing to the same checkout while it worked. Adversaries and
fixers should not run against one shared working tree at the same time; later rounds dispatch fixers
only once every adversary of that round has reported.

### Round 1 fixes — endpoint (opus), five commits, 30 → 37 tests

- The blocker coverage hole: a two-ward test asserting both wards' sub totals and the hospital
  total together. Proven by making exactly the mutation — the new test fails while all 30 old tests
  still pass.
- The unhosted facility: `req.settings[facilityId]` must be a reader whose own facility matches,
  else a clean client error. One check closes three doors — the missing reader, a facility whose id
  is literally `global` reading the server-wide settings, and prototype members like `constructor`.
- Prototype keys: the counts accumulate on `Object.create(null)`. Every other id-keyed structure in
  the file was audited and is a `Map` or a `Set`.
- The foreign ward: a facility condition in the LEFT JOIN, so the foreign ward joins away and its
  patient lands in No area with the bed still listed, rather than dropping off.
- An empty setting is treated as unset, and the empty-facility response shape is now asserted.

**A follow-up for the author, found while fixing:** `upcomingVaccinations`, `tasks` and `kiosk`
carry the same unguarded `req.settings[req.facilityId].get(...)` shape, so the same 500 with the raw
message is reachable through them. Out of this card's files; the fix is identical.

Also raised and not done, deliberately: `?areaId=<a foreign ward>` still returns an empty sheet
rather than a 404, which is a behaviour change beyond the finding and leaks nothing.

The PDF fixer was cut off mid-wiring by a usage limit and resumed from its own partial state: the
pure function and its test were on disk, the component half-wired.

### Round 1 fixes — printed sheet (opus), commit `5399346`, plus `f2df569`

The pagination cause, diagnosed in `@react-pdf/layout` rather than guessed: a `fixed` child is
pushed onto both the current and the next page and `shouldBreak` bails for it immediately, so the
ward's heading block was painted at the foot of a page even when the `wrap={false}` Sub total row
after it could not fit. The `firstPageOfWard` heuristic was never wrong — the layout was.
`minPresenceAhead` on the heading does nothing (fixed nodes bail), and on the ward table it is also
dead (its clause requires `!shouldSplit`, and a table reaching a page boundary always splits), so
the fix is the idiom two other printouts already use: a zero-height sibling carrying the request.

The baseline had TWELVE stranded headings in the 40-ward render, each with a false "(continued)" —
not the one case the evidence showed. After the fix a text-level detector over `pdftotext -layout`
reports none across six fixtures, genuine continuations still read "(continued)" with their headers
repeated, and the page counts are unchanged, so it costs no paper.

A nameless non-regular column now prints **Unknown diet**. The display rules moved into a pure
`prepareDietSummary` with ten unit cases, which closes the gap the review loop recorded: ordering by
RESOLVED label is now pinned, including that a translation changes the order.

I moved that test to `packages/shared/__tests__/`, where every other test in the package lives; it
was the only co-located one, which the fixer had flagged against its own ownership boundary.

Carried as caveats: `MIN_WARD_PRESENCE` is an estimated height, not a measured one, and the fix is
unverified under `features.useGlobalPdfFont`, where line heights differ. The re-check is attacking
both.

### Round 1 checkpoint

Lint PASS · diet summary endpoint tests PASS (37, up from 30) · shared PASS (236, including the 10
new `prepareDietSummary` cases) · settings PASS (97) · web unit PASS (747) · build PASS.

### Re-check of round 1's fixes (opus) — 0 blocker, 2 high, 2 medium, 2 low

It broke two of the seven fixes and could not break the other five. Each hunk was reverted one at a
time: the matching test failed, the rest passed, and the file was restored with an empty `git diff`
every time.

- R1 (high, A REGRESSION WE INTRODUCED) a diet whose id is `__proto__` now crashes the ENTIRE
  render. The server counts it correctly, so the column exists; `TotalCells` still does
  `totals[key]`, so a ward with nobody on that diet reads `Object.prototype`, React rejects it as a
  child and the PDF fails. Before our fix the column never existed and the sheet merely
  under-counted one patient — so the fix made the outcome worse. My partitioning caused this: the
  security finding said to guard the PDF's lookup too, and I gave that file to a brief that did not
  mention it. → fix now.
- R3 (BLOCKER in effect, filed by the adversary as its own finding) the sheet NEVER FINISHES
  rendering past about twenty wards — 20, 22, 24 and 40 all fail to complete in 180 seconds, one
  burning 15 minutes of CPU. Data-shape dependent: 40 wards of one patient each does render, which
  is why the earlier round's evidence completed, and a 1-patient plus a 200-patient ward renders in
  3.7s until a third ward is added. The cause is the `fixed` child inside a table that wraps across
  pages, which is this branch's own `WardHeading`: removing `fixed` renders the same 20 wards in
  3.0 seconds. In a browser this hangs the tab, so a hospital with enough wards cannot print the
  sheet at all. → fix now, keeping the spec's repeated "(continued)" heading.
- R2 (medium) `ROW_HEIGHT = 19` against a measured 24.2pt under the global font and 35.4pt with
  wrapping names, so some wards still open with heading, headers and Sub total but no patient row.
  Still a large improvement — stranded headings 24 → 0 and 26 → 0, at no cost in pages. → fix now,
  or drop if the blocker's fix removes the construct.
- R4 (medium, PRE-EXISTING, not ours) a facility whose id is `constructor` 500s with a raw
  TypeError in `auth.js` before the route is reached, which makes our guard's prototype branch dead
  code. Follow-up for the author, with the same shape as the `req.settings[...]` follow-up already
  recorded.
- Nothing was removed or weakened; the test file's diff is insertions only.

### The blocker, reproduced and fixed — commit `db8bb73`

The agent working this stalled twice on long renders and did not survive a session restart, so I
finished it myself with bounded, timed runs. Its decisive finding was preserved: removing `fixed`
is NOT the cure (2 runaways in 24 trials), moving the table's bottom margin is (0 in 24).

I did not take that on trust, because my first fixture did not reproduce the hang at all — 20 wards
of varied sizes rendered in 1.5s with and without the change. Reproducing it needed the adversary's
own shape:

| shape | without the fix | with the fix |
|---|---|---|
| 1-patient ward + 200-patient ward | 0.8s | 0.9s |
| the same, plus a third ward of 1 | **never finished, killed at 150s** | 0.9s |
| the same, plus a third ward of 7 | not reached | 0.9s |

So the cause is a bottom margin on a node that wraps across pages, and the spacing now sits on the
spacer already between wards. Both halves proven, not assumed.

The `__proto__` regression is fixed and proven both ways: against the unfixed file the render dies
with React error #31, and with the guard it produces a document. The lookup is the only id-indexed
one left in the directory; everything else is a Map, a Set or an array.

`ROW_HEIGHT` is now the height a row is measured at when a name wraps rather than a plain 19pt, so
a generous estimate moves a ward to the next page instead of stranding its heading.

Pages read after the fix: a ward that genuinely spans a break still reads "(continued)" with its
column headers repeated, and the ward after it starts whole with its Sub total and rows. Shared
suite 236 passing, eslint clean.
