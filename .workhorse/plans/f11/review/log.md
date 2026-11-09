# Review loop — diet summary sheet (TAM-2141 / F11)

Branch `feat/TAM-2141/diet-summary-sheet` against `main`. Rigour assumed **standard** (cap 5 rounds,
two clean rounds in a row, the second cold) — this conversation runs outside Workhorse, so no run
tools are available: rounds and findings are recorded here rather than filed.

## Configuration in the room

- The branch changes no `CLAUDE.md`, `AGENTS.md`, `.claude/` or `.mcp.json` file, so the reviewers
  ran under the base branch's own configuration.
- There is no `.mcp.json` at the repository root. `.claude/` holds `settings.json`,
  `settings.local.json`, `agents/`, `hooks/`, `skills/` (the Workhorse skills), all from the base.
- Reviewer prompts and conventions were read from `main`, never from the branch.
- Suppressions (`.github/review-hero/suppressions.yml` on `main`): one rule, about
  `styled-components` `attrs` providing default children. Nothing in this diff matches it.

## Round 1

Reviewers (all read-only `Explore` agents): bugs and correctness (sonnet), security (opus),
performance (sonnet), design and architecture (fable), accessibility (sonnet), BES requirements
(sonnet), integration tests (sonnet), E2E tests (sonnet).

Findings and dispositions follow once the reports are in.

### Reports as they land

**E2E tests (sonnet)** — 1 suggestion.
- `packages/e2e-tests` — no Playwright test covers the Diet summary button or its PDF modal.
  Reviewer notes Bed management has only an empty stub spec and Handover notes (the sibling
  feature) has no E2E test either, so this follows the existing untested precedent rather than
  regressing. Precedent for the assertion exists in `tests/patients/encounterRecord.spec.ts`
  (PDF iframe visible, `src` matches `/^blob:/`, no error fallback).

**Performance (sonnet)** — 1 critical, 1 nit.
- CRITICAL `dietSummary.js` join on `encounter_diets.encounter_id` has no index to serve it.
  CONFIRMED: `000_baseline.sql` gives the table only `encounter_diets_pkey` (id) and
  `encounter_diets_updated_at_sync_tick_index`, and no later migration adds one. The scan cost
  grows with every diet ever recorded rather than with the open encounters the response returns.
  → fix now (migration, partial index on `encounter_id WHERE deleted_at IS NULL`).
- NIT `locations.facility_id` unindexed. SKIPPED: it is a residual filter after a primary-key
  join on reference-sized data; the reviewer itself says it is not worth a migration.

**Security (opus)** — 1 critical, 1 suggestion, 1 nit.
- CRITICAL `facilityId` read from `req.query` and never checked against the caller's token, so
  any authenticated user with the four generic permissions can read a sibling facility's whole
  inpatient roster by passing its id. CONFIRMED: `req.facilityId` is set from the verified token
  in `middleware/auth.js`, after `setFacilityHandler` has checked `canAccessFacility`, and
  `kiosk.js` is the precedent for refusing when it is absent. → fix now.
- SUGGESTION no input validation: `req.settings[facilityId]` on an unknown or `__proto__` key
  throws a raw `TypeError` that reaches the client, and an array `areaId` reaches the SQL
  replacement. → fix now, with zod as the neighbouring routes do.
- NIT no `req.audit.access` record for what is a bulk export of patient identifiers.
  → DECISION FOR THE USER: handover notes does not audit either, and auditing per encounter would
  write a row per inpatient per print. Not invented here; raised in the report.

**Accessibility (sonnet)** — 2 (1 suggestion, 1 nit).
- SUGGESTION the tick is drawn vector geometry, so the PDF text layer carries nothing for a
  ticked cell. SKIPPED with reason: verified with fontkit that neither registered font has a tick
  glyph (U+2713, U+2714 and U+2717 are all absent from NotoKufiArabic, and Helvetica's WinAnsi
  encoding has none either), so the mark cannot be text without shipping a new font; react-pdf v3
  cannot tag content either. Raised as a decision in the report instead.
- NIT rotated diet headers called a new pattern for the codebase. SKIPPED: factually wrong —
  `patientCertificates/EncounterRecordPrintout.jsx:211` already rotates its vitals column headers
  the same way on a landscape A4 page. Carry this reason into later rounds.

**Integration tests (sonnet)** — 2 suggestions, 2 nits.
- SUGGESTION no unauthenticated-request case (only least-privilege-forbidden). → fix now.
- SUGGESTION the missing-`facilityId` validation path is untested. → fix now, reshaped by the
  security fix (the endpoint will take the facility from the session, not the query).
- NIT the `reference_data diets` join has no `deleted_at IS NULL` filter, unlike the
  `encounter_diets` join above it, so a soft-deleted diet still recorded against a current
  encounter still takes a column. CONFIRMED by reading the route. → fix now, with a test.
- NIT an unknown `facilityId` makes `req.settings[facilityId]` undefined and throws a 500.
  Duplicate of the security suggestion; fixed there.
- It independently verified the natural bed ordering against live Postgres (`en_numeric`
  collation on `locations.name`) and confirmed the plain `ORDER BY` is correct.

**BES requirements (sonnet)** — 1 suggestion.
- SUGGESTION `DietSummaryPDF.jsx` builds the "(continued)" ward heading by concatenating two
  separately translated fragments, which `llm/project-rules/translations.md` names as an
  antipattern; other languages need different word order or punctuation. CONFIRMED. → fix now,
  as one string with a `:ward` replacement.
- Checked clean: AU/NZ spelling across all nine files; translation coverage of every user-facing
  string on the web and in the PDF; reference data categories (`locationGroup`, `diet`);
  permission checks matching the handover-notes set; settings placement, shape and suggester;
  parameterised SQL.

**Design and architecture (fable)** — 4 suggestions, 4 nits.
- SUGGESTION the "(continued)" ward heading mutates a `let` from inside a react-pdf `render`
  prop and leans on two undocumented internals of `@react-pdf/layout`. CONFIRMED as written,
  though the mechanism is copied from `EncounterRecordPrintout`'s `MultipageTableHeading`, which
  is the repo's existing precedent. → fix now: name the helper and comment what it depends on.
  The render test it asks for is SKIPPED: the test setup has no PDF text extraction, and the
  behaviour was verified by rendering a three-page document during implementation, with
  "Cardiology (continued)" on pages 2 and 3.
- SUGGESTION `isRegular` is produced and asserted but never read; the PDF branches on
  `name == null` instead. CONFIRMED. → fix now by dropping `isRegular`.
- SUGGESTION the setting names deployment-wide reference data but is declared facility-only, so
  a multi-facility deployment sets it per facility and an unset one silently prints a different
  sheet. CONFIRMED against `llm/project-rules/settings.md`. → fix now: declare the subtree in
  `global.ts` as well, keeping the facility override. Its secondary point (flatten the path to
  `bedManagement.regularDietId`) is SKIPPED: the extra level is what names the sheet in the admin
  panel, and renaming a settings path later is a migration.
- SUGGESTION the search bar now carries two modal booleans, four handlers, two buttons and two
  modals beside the search fields. → fix now: give the diet summary its own button component
  owning its state and modal, and move the icon sizing rule off the shared button, where it never
  matched the handover notes SVG anyway.
- NIT `sumTotals` duplicates `countByKey`. → fix now.
- NIT `NO_AREA_KEY = ''` is unnecessary; a Map can key on null. → fix now.
- NIT reuse `HandoverHeaderSection` with a title prop rather than a third letterhead block.
  SKIPPED: it would change a component the handover notes printout owns, for a cosmetic win, and
  the two headers differ in sizing and in carrying a hard-coded title.
- NIT no `// spec: DIET` code references. → fix now; `recentlyDischargedPatients.js` is the
  precedent.
- Checked clean: endpoint placement, permission set, icon library convention, PDF props,
  suggester validity, counting on the server, and the locality of the search bar rename.

**Bugs and correctness (sonnet)** — 2 criticals, 1 suggestion.
- CRITICAL `facilityId` trusted from the query. Same finding as the security reviewer's, found
  independently. Merged; fixed once.
- CRITICAL `dietKeys` is not deduplicated, so an encounter carrying the same diet twice is counted
  twice in the sub total and the hospital total while the PDF still draws one tick — the sheet's
  totals would disagree with its own ticks. CONFIRMED: `encounter_diets` has no unique constraint
  on `(encounter_id, diet_id)`, and `setDiets`/`addDiets` take the array straight from the request
  body. → fix now, with a test.
- SUGGESTION raw SQL does not get the paranoid models' automatic exclusion, and
  `locations.deleted_at` / `location_groups.deleted_at` are unfiltered, unlike sibling raw-SQL
  queries in `patientLocations.js` and `patientRelations.js`. → fix now.
- Checked clean: natural bed ordering, double-counting from two simultaneous open encounters
  (blocked upstream), the regular-column construction and sentinel collision, the PDF HOC prop
  wiring, the empty state, and SQL injection via `areaId`/`encounterTypes`.

### Round 1 totals (after merging duplicates, before fixes)

critical 3, suggestion 11, nit 9.

### Round 1 fixes dispatched

| Fixer | Owns | Findings |
|---|---|---|
| migration (sonnet) | `packages/database/` | the `encounter_diets` index — DONE, verified against the live dev database, committed |
| endpoint (opus) | `dietSummary.js`, `DietSummary.test.js` | facility from the session, zod validation, soft-deleted diets and locations, drop `isRegular`, dedupe diet keys, dedupe the reducer, drop the sentinel, spec refs, new tests |
| pdf (sonnet) | `DietSummaryPDF.jsx` | one-string "(continued)" translation, named `WardHeading` with the react-pdf dependency documented, spec ref |
| web (sonnet) | `packages/web/` | extract `DietSummaryButton`, move the icon rule, stop sending `facilityId` |
| settings (sonnet) | `packages/settings/` | declare the subtree in `global.ts` with the facility override |

Skipped, with reasons recorded above: the E2E test (cannot be verified in this session, and there
is no bed management E2E coverage to extend — raised as a follow-up), the tick's text layer, the
rotated headers, `locations.facility_id`, the letterhead reuse, and flattening the setting path.

## Round 2

All five fixers landed, six commits on the branch:

```
d33890535f fix(bedManagement): TAM-2141: take the diet summary facility from the session
ee41944c18 fix(settings): TAM-2141: declare bedManagement.dietSummary.regularDietId globally too
6f2d3a6d80 refactor(web): no-issue: extract DietSummaryButton from the bed management search bar
bffded4668 fix(bedManagement): TAM-2141: extract ward heading and fix continued translation
330163b381 db: TAM-2141: index encounter_diets by encounter id
755dee5b7a feat(bedManagement): TAM-2141: add the diet summary sheet
```

Round 2 runs seven lenses against the new diff, each given a ledger of what round 1 decided so a
settled finding is not raised again, and each asked to check round 1's fixes as new, unreviewed
code. The E2E lens is not rerun: its one finding is a standing decision recorded in the ledger,
and rerunning it would only re-raise it — so that lens never comes back clean, which the final
report says plainly rather than papering over.

A `haiku` checkpoint runs lint, the facility-server suite, the settings and shared suites, and
the build alongside it.

### Round 1 checkpoint

- Lint on every changed file: PASS
- `DietSummary.test.js`: PASS, 15 tests
- Settings suite: PASS (97 passed, 2 pre-existing skips)
- Shared suite: PASS (226 passed)
- Build (web-frontend and patient-portal): PASS
- Full facility-server suite: 14 failures across 8 files — `User.test.js`, `Patient.search.test.js`,
  `idempotency.test.js`, `serverConfig.test.js`, `SystemErrorReport.test.js`,
  `SetupDeclaredConfig.test.js`. None touches diet summary, bed management, settings or migrations,
  and the checkpoint agent judged them pre-existing. TO VERIFY against `main` once the round 2
  reviewers have finished reading the working tree — not taken on trust.

### Round 2 reports

**Integration tests (sonnet)** — 1 critical, 1 suggestion. Both coverage gaps in the filters
round 1 added:
- CRITICAL nothing tests `encounter_diets.deleted_at IS NULL`. That is the filter that keeps a
  cancelled diet off the sheet, and it is the real clinician path: `setDiets` uses Sequelize's
  `belongsToMany.set()`, which soft-deletes the join rows for diets removed from the list. The
  existing tests only ever soft-delete the `ReferenceData` diet, never the join row. → fix now.
- SUGGESTION nothing tests `patients.deleted_at IS NULL`, and a naive `patient.destroy()` could
  not test it, because the cascade would soft-delete the encounter and the result would be hidden
  behind a filter that is already covered. → fix now, with the file's own `markDeleted` helper.
- Checked clean: the natural ordering assertion (verified empirically against Postgres), the two
  existing `.destroy()` soft-delete tests, and the area filter and regular-column fallback, each
  by reasoning through what would fail if the branch were removed.

**Accessibility (sonnet)** — 1 suggestion, 1 nit, both SKIPPED as out of scope and raised as
follow-ups:
- SUGGESTION the shared `PDFLoader` swaps a loading indicator for the rendered iframe with no
  `role="status"` or live region, so a screen reader announces neither. CONFIRMED, but it is a
  property of a shared component this branch does not touch, used by every PDF modal in the app —
  Review Hero's own rule is to comment on changed code, and the fix belongs to all of them.
- NIT the preview iframe's accessible name is the raw id "diet-summary", because `PDFLoader` uses
  `title={id}`. Same reason: fixing it properly means a new prop on the shared component.
- Checked clean: no ARIA added anywhere in the diff, both print buttons are native buttons with
  visible-text accessible names and default-hidden icons, the `PrintActions` div correctly takes
  no role, and moving the modal inside `DietSummaryButton` is focus-neutral because MUI's Dialog
  portals to `document.body` regardless of React tree position.

**Performance (sonnet)** — 1 suggestion.
- SUGGESTION `ReferenceData.findByPk` for the configured regular diet runs on every request where
  the setting is set, but its result is only used inside `if (hospitalTotals[regularKey])`, and is
  redundant anyway when a patient on the sheet has that diet recorded, since `dietNamesById`
  already holds the name. → fix now.
- Verified round 1's index with `EXPLAIN (ANALYZE, BUFFERS)` against the live dev database: the
  partial index's predicate matches the join's filter exactly and Postgres pushes the condition
  into `Index Cond`. It noted honestly that the dev table is empty, so the full query's plan there
  is not representative.
- Checked clean: the four new `deleted_at` filters all land as residual filters on primary-key
  driven scans, the `location_groups` ON-clause condition changes no plan, the JS grouping is
  linear, and the PDF's two-pass resolution costs nothing new.

**BES requirements (sonnet)** — 1 suggestion.
- SUGGESTION `PrintActionButton` was copied rather than shared when `DietSummaryButton` was
  extracted, and the two copies have already diverged. → fix now.
- Checked clean: the migration's timestamp, naming, pure-DDL shape, non-destructive down, and that
  no mobile or dbt change is owed for an index; the settings declaration at both scopes; the
  endpoint's session facility, permission flagging, zod parse and parameterised SQL; the PDF's
  translation calls and reference data ids; and the web string ids.

**Design and architecture (fable)** — 3 suggestions, 2 nits.
- SUGGESTION the spec has drifted from round 1's fixes: it still calls the setting a facility
  setting, and three rules about deleted records live only in code comments and tests. CONFIRMED.
  → fix now, in the spec.
- SUGGESTION the dual settings declaration copies the whole subtree into both files and the copies
  have diverged; the codebase shares such a leaf through `definitions/` (`letterheadProperties`).
  CONFIRMED. → fix now.
- SUGGESTION same `PrintActionButton` duplication as the BES lens, plus the asymmetry that the
  search bar still owns handover notes' state inline. → fix now, both parts.
- NIT the `dietNamesById.get(regularKey)` fallback is dead: models are paranoid, so `findByPk`
  excludes exactly what the join's `deleted_at` filter excludes. → fix now, with the performance
  lens's finding about the same lookup.
- NIT the comment "matching what bed management itself shows" overstates the match — bed
  management also filters on visibility status and single occupancy. CONFIRMED. → fix the comment,
  and state the real rule in the spec.
- Checked clean: the settings cascade order, every other spec criterion against the code, natural
  bed ordering, the index's predicate, that no mobile model is owed, the PDF props, that the modal
  refetches on open (so the snapshot criterion holds), and that button-owns-its-modal has
  precedent in `NewAppointmentButton` and `EmailButton`.

### Round 2 fixes dispatched

| Fixer | Owns | Findings |
|---|---|---|
| spec (sonnet) | `specs/encounters/diet-summary-sheet.md` | setting scope, deleted bed/ward/diet rules, retired beds |
| settings (sonnet) | `packages/settings/` | share the subtree through `definitions/` |
| web (sonnet) | `packages/web/` | share `PrintActionButton`, extract `HandoverNotesButton` |

The endpoint fixer waits for the bugs and security lenses, so one agent owns that file.

**Security (opus)** — 3 suggestions, 1 nit.
- SUGGESTION the modal never passes `translations` to the PDF, so `withLanguageContext` builds
  `getTranslation` from nothing and every label falls back to English, and ward and diet names to
  their raw reference data names — contradicting the spec's own translation criterion. CONFIRMED
  against the pattern in `EncounterRecordModal` and `LabResultsPrintoutModal`. → fix now.
- SUGGESTION the query's error state is dropped, so a 403, a 422 or a dropped connection renders a
  fully letterheaded sheet reading "There are no patients to show" — a failed request printed as an
  authoritative empty hospital. → fix now.
- SUGGESTION the reference data join guards only `deleted_at`, though `encounter_diets.diet_id`
  carries no type constraint and the encounter route passes client-supplied ids into `setDiets`
  unchecked. → fix the `type = 'diet'` half now. The reviewer also asked for
  `visibility_status = 'current'`; DECIDED AGAINST: retiring a diet stops it being offered for new
  records, it does not unrecord it, and dropping its column would silently recount that patient as
  regular — the kitchen would cook the wrong meal. Same principle as the retired-bed rule the spec
  now states.
- NIT the "matching what bed management itself shows" comment, raised by the design lens too.
  → fixed in the comment and stated properly in the spec.
- Verified round 1's fixes genuinely close what they claim: `req.facilityId` traced from the signed
  token and unreachable from the client, zod stripping the stray query key (which is what makes
  that test meaningful), the 422 path holding because `zod` resolves to a single root copy, the
  permission set covering everything the response returns, nothing patient-identifying reaching a
  log, `areaId` not being an authorisation vector, and the index predicate matching the join.

**Bugs and correctness (sonnet)** — 1 suggestion, 1 nit.
- SUGGESTION `fontWeight: 500` on the ward headings and total rows is dead: `TextWithoutContext`
  spreads its bold branch after the passed style, so the `bold` prop's 700 always wins. The rows
  print full bold while the spec claimed medium. CONFIRMED by replaying the spread.
  DECIDED: keep bold and correct the spec. Neither registered font ships a medium face, so dropping
  `bold` would render these rows at regular weight and lose the distinction from the patient rows
  entirely. This is a deviation from the Linear card's "medium weight" request — raised for the
  author in the report.
- NIT past about 38 diet columns the table runs off the right edge, because the column width is
  clamped at a floor and never below it, breaking the spec's one-page-wide guarantee. → fix now:
  the guarantee wins, so the width falls below the floor when it has to.
- Verified round 1's fixes correct: the zod parse and its 422 path, the collation, the placement of
  all three soft-delete filters, `countByKey`'s equivalence to the old `sumTotals`, the null-keyed
  Map, the `WardHeading` closure surviving react-pdf's two-pass resolution (checked against the
  layout source), the settings cascade, and the `useCertificate`/`PDFLoader` wiring.

### Round 2 totals (after merging duplicates, before fixes)

critical 1, suggestion 9, nit 4.

### Round 2 fixes

| Fixer | Owns | Status |
|---|---|---|
| spec | `specs/encounters/diet-summary-sheet.md` | committed `af8de57`, plus `123bd48` for the weight and retired-diet rules |
| settings | `packages/settings/` | committed `86c6c0b` — subtree shared through `definitions/dietSummary.ts` |
| web | `packages/web/` | committed `7418ef6` — shared `PrintActionButton`, `HandoverNotesButton` extracted, `translations` passed to the PDF, and a failed fetch no longer prints as an empty sheet |
| pdf | `DietSummaryPDF.jsx` | running — dead weight declarations, column width guarantee |
| endpoint | `dietSummary.js` + test | running — `type = 'diet'`, comment, redundant lookup, three new tests |

The 60-column stress render fits the content width exactly, with the rotated headers overlapping
each other. That is the answer to the open "column width" question on TAM-2141: the sheet stays one
page wide and the columns cramp, rather than running onto a second sheet. Worth the author's eye.

### Round 2 checkpoint

Lint PASS · diet summary endpoint tests PASS (18) · settings PASS (97) · shared PASS (226) ·
web unit tests PASS (747) · build PASS.

## Round 3

Seven lenses rerun against the 12-commit diff, each given the ledger as it now stands, with round
2's fixes called out as the newest and least-reviewed code.

Still outstanding from the round 1 checkpoint: verifying against `main` that the 14 facility-suite
failures are pre-existing. It cannot run while reviewers are reading the working tree, so it waits
for round 3 to finish.

### Round 3 reports

**Accessibility (sonnet)** — 1 critical, 1 suggestion, both on the error branch round 2 added:
- CRITICAL the error message is a plain styled `<p>` with no `role="alert"` and no live region, so
  a screen reader gets no signal that the sheet failed to load — the dialog simply goes silent
  where the PDF was. The reviewer correctly separates this from the ledger's shared-`PDFLoader`
  item: this is new code written for this modal alone. `FormErrorMessage role="alert"` is the
  in-repo precedent. → fix now.
- SUGGESTION the Print button is focusable throughout loading and unmounts the instant the query
  errors, so focus falls to `document.body` with nothing announced. → fix now, by moving focus to
  the error.
- Checked clean: the extracted `HandoverNotesButton` is structurally equivalent to what `main`
  had, `PrintActionButton` changes no semantics, and the shared modal and loader are unchanged.

**Integration tests (sonnet)** — 3 suggestions, 1 nit. All → fix now:
- The regular-column name lookup is never exercised successfully: the one test that reaches it has
  already deleted the diet, so a regression making it always return null would pass every test and
  print a blank Regular header.
- `ENCOUNTER_TYPES.OBSERVATION` (active ED care) appears nowhere in the file, though it is one of
  the four types the sheet covers.
- Nothing proves a bed that is merely retired keeps its patient — the inverse of what most
  "retired resource" queries do, and a spec criterion, so a well-meaning future
  `visibility_status = 'current'` filter would silently drop those patients uncaught.
- NIT `expect.arrayContaining` on `dietKeys` also passes with stray extra keys.

**Performance (sonnet)** — CLEAN. Confirmed the migration is applied on the dev database, then
built synthetic volume inside rolled-back transactions (2,000 then 6,000 open admissions, 40 then
150 wards, 30,000 live `encounter_diets` rows under a 60,000-row soft-deleted layer) and read the
plans: the partial index is used as written in every variant, the new `type` predicate leaves the
reference data join a per-row primary-key lookup, and diet churn over a long admission does not
inflate the join because the partial index only covers live rows. It weighed and dismissed one
thing: at 6,000 simultaneous admissions the `ORDER BY` spills to disk for under 50ms.

**Bugs and correctness (sonnet)** — CLEAN. Traced every branch of the conditional diet-name lookup
against the paranoid default and confirmed it is equivalent to the unconditional version it
replaced; checked the column width's boundary behaviour; mechanically diffed the extracted
`HandoverNotesButton` against `main` and found it byte-for-byte identical but for `margin-right`
moving to the `PrintActions` wrapper; and re-verified the dead font weight and the `WardHeading`
closure semantics.

**BES requirements (sonnet)** — CLEAN. Checked the shared settings definition against the
`vaccinations` and `templates.letterhead` precedents, diffed the extracted button against `main`,
checked the new error string's id shape against about fifteen sibling `*.error` ids, confirmed the
`type = 'diet'` predicate is bound rather than interpolated and that its justifying comment is
accurate, matched the permission set to the handover notes endpoint, and scanned every added line
for US spelling.

**Design and architecture (fable)** — 4 suggestions, 3 nits. All → fixed this round:
- A 403 reaches the client as a `ForbiddenError` and the modal tells the user to try again.
  `EncounterRecordModal` and `InvoiceRecordModal` already render `ForbiddenErrorModalContents`.
- `printable` is suppressed on error but not while loading, and `printPDF` has no null check, so a
  click during the fetch throws and nothing prints.
- Round 2's settings dedup moved the divergence into one string that is wrong in one of its two
  homes, and only the leaf was shared — the wrappers could still drift.
- Column and ward ordering is decided on the server against source-language names while the sheet
  prints translated ones, so the spec's "alphabetically" does not hold where translations exist.
- Three nits: the bold-weight note sat mid-section, four criteria carried absence or transition
  phrasing, and `DietSummaryPrintActionButton` is a layer with no behaviour of its own.

**Security (opus)** — 1 critical, 2 suggestions, 1 nit:
- CRITICAL the client-side sort identified the regular column from
  `getSetting('bedManagement.dietSummary.regularDietId')`, which is not `exposedToWeb` and so is
  always undefined in the browser — it only looked right because the fixer's harness passed it a
  value. Wherever a deployment configures a regular diet that still exists, the column would be
  filed alphabetically instead of leading. Found in code written during this very round. → fixed
  by marking the column server-side and sorting on that, with `isRegular` reinstated now that
  something reads it.
- SUGGESTION `lookupDietName` has no type constraint, so a setting pointing at a village or a drug
  prints its name as the regular column header. → fix now.
- SUGGESTION the footer carries no `printedBy`, and since we decided against an audit record for
  the read, the document is the only possible trace of who took the ward's roster out on paper.
  → fix now.
- NIT no `data-testid` anywhere on the new modal, where its sibling tags three elements. → fix now.
- Checked clean: every binding, the facility from the token, zod's rejection and error mapping, the
  permission flagging, that the error branch leaks no detail, the `:ward` replacement not being
  re-expanded, the collation, the index choices, and that `PrintActionButton` preserves the
  `pointer-events: auto` the handover tooltip depends on.

### Round 3 totals (after merging duplicates, before fixes)

critical 2, suggestion 10, nit 5. Performance, bugs and BES came back clean.

### Round 3 fixes

| Fixer | Owns | Status |
|---|---|---|
| spec | `specs/encounters/diet-summary-sheet.md` | `257d19f` voice and ordering, `d6e0147` the footer's printed-by |
| settings | `packages/settings/` | `821a143` — neutral leaf description, scope wording on each wrapper, properties shared |
| pdf (sort) | `DietSummaryPDF.jsx` | `274684d` — sort by translated labels, wards and columns |
| pdf (regular, footer) | `DietSummaryPDF.jsx` | `85c9740` — sort on the server's `isRegular`, render `printedBy` |
| web | `packages/web/` | `0b524e1` — `role="alert"`, focus on error, forbidden branch, printable gating, `printedBy`, test ids, wrapper folded |
| me | `DietSummaryModal.jsx` | `07f6724` — the forbidden branch's confirm button had no handler, because the two sibling modals it was copied from pass `onClose` where the component takes `onConfirm`. Fixed here; the siblings are pre-existing and left alone, raised as a follow-up |
| endpoint | `dietSummary.js` + test | `70f62af` — `isRegular` reinstated with a consumer, `lookupDietName` type-constrained, four test gaps closed, every new test mutation-checked |

21 endpoint tests now, each new one confirmed to fail against the unfixed code.

### Round 3 checkpoint, and the pre-existing failures settled

The 14 facility-suite failures were checked rather than assumed: the same six files and the same
14 tests fail on `main` and on the branch, with nothing failing only on the branch. Pre-existing.

Lint PASS · diet summary endpoint tests PASS (21) · settings PASS (97) · shared PASS (226) ·
web unit tests PASS (747) · build PASS.

## Round 4 — cold

Seven lenses, fresh agents, given the diff and the base branch's conventions and NO ledger, so
nothing settled can steer them. Anything they raise that an earlier round decided is dropped in
triage against the ledger, which is where a cold round's duplicates belong.

### Round 4 reports

**Design and architecture (fable, cold)** — 3 suggestions, 2 nits.
- SUGGESTION `WardHeading` is a third hand-rolled copy of the `MultipageTableHeading` pattern
  (`EncounterRecordPrintout`, `InvoiceRecordPrintout`), each with its own partial explanation of
  react-pdf's two-pass render. FOLLOW-UP, not this card: the value is in retrofitting all three,
  which means changing two printouts this card does not touch, and extracting a primitive for one
  caller would add an abstraction while leaving the duplication in place.
- SUGGESTION the spec does not state what the tests already pin: a deleted diet, a cancelled diet
  record or a non-diet record takes no column, and a patient left with nothing by that counts under
  the regular meal. CONFIRMED. → fix now.
- SUGGESTION the 406-line PDF module should split the way `handoverNotes/` does, and its private
  `Letterhead` is a second bed-management header clone. SKIPPED: the file is one document renderer
  whose parts have no other caller, it has been verified by repeated renders, and splitting it this
  late buys little for the risk; the shared-header half was already decided against in round 1.
  Noted as an optional follow-up.
- NIT `id: DIET` claims the generic concept for a printout, and spec ids are permanent — recording
  a diet on an encounter is the more fundamental spec that would want it. Cheap now, four comments
  and the frontmatter. → fix now.
- NIT ordering has two owners: the server sorts columns by name and wards `NULLS LAST`, and the PDF
  discards both to sort by translated label. → fix the dead column sort. KEEPING the SQL
  `ORDER BY`: it costs nothing, keeps the response deterministic for anyone reading it directly,
  and keeps the area-order assertions in the tests strong rather than order-insensitive.
- Verified sound: the dual settings declaration, the session facility, the route's placement, the
  index and its naming, the collation behind the bed-order test, the forbidden branch, and all 37
  spec criteria against the code, with the `// spec:` slugs resolving.

**Performance (sonnet, cold)** — 1 suggestion.
- SUGGESTION `locations.facility_id` is unindexed and the plan shows a `Seq Scan on locations` as
  the driving scan, not a residual filter — and `Location` has no facility sync filter, so every
  facility server holds every facility's locations, making the table deployment-wide rather than
  facility-bounded. This CONTRADICTS the reason round 1 skipped the same finding, so the earlier
  decision is reopened and the reviewer has been asked for measured timings at 5,000 and 50,000
  locations, with and without the index, before it is settled either way.
- Checked adequate: the open-encounter lookup using `encounters_end_date`, the new partial index
  being used, the linear JS grouping, the single settings and diet-name lookups, and the
  primary-key-keyed reference data and area joins.

**Accessibility (sonnet, cold)** — 1 critical, 1 suggestion, 1 nit.
- CRITICAL the forbidden branch added in round 3 is dead code: `instanceof ForbiddenError` can
  never be true, because the API client throws a `Problem`, which extends `Error` directly, while
  `ForbiddenError` extends `BaseError`. VERIFIED by reading both class declarations. A user the
  server denied is told to try again. → fix now, discriminating on `error.type` as
  `classifyApiError.js` does. The two sibling modals carry the same dead check; pre-existing, left
  alone, raised as a follow-up.
- SUGGESTION focus and announcement are handled for the general error branch but not the forbidden
  one, though both render from the same state swap and MUI's Dialog only manages focus on mount.
  → fix now, covering both from one place.
- NIT the dismiss button falls back to the generic "Confirm" label. → fix now.

**Security (opus, cold)** — 2 suggestions.
- The dead forbidden branch, found independently. Same fix.
- The bulk read still writes no `AccessLog`, while single-record reads of far less data do. This
  reopens what round 2 recorded as a decision: my reason then was that auditing per encounter would
  write a row per inpatient per print, but `logs.accesses` is `DO_NOT_SYNC` and local, and
  `req.audit.access` is a no-op unless a deployment enables `audit.accesses.enabled`, so the cost
  is opt-in. STILL A DECISION FOR THE AUTHOR, now better evidenced: the open question is the
  granularity — a row per listed encounter against one per print — which is a compliance call for
  the team, not one to make unilaterally. Raised prominently in the final report.
- Checked clean: the replacements, the permission flagging and its interceptor, the cross-facility
  filter, zod stripping a client-supplied `facilityId`, no PHI in logs or thrown messages, no HTML
  sink, the react-query cache being purged on login and logout, and no index name collision.

**BES requirements (sonnet, cold)** — CLEAN. Checked AU/NZ spelling line by line, translation
coverage on both the web and the PDF (including the reference data categories and the reused NHN
string id), the permission set against the handover notes endpoint, the settings pattern against
the `tasking` example in the rule, that `diet` and `locationGroup` need no new provisioning entry,
the migration's timestamp, DDL-only shape and the absence of a mobile or dbt obligation, and it
verified the natural bed ordering empirically against the test databases.

**Performance measurements, settled**

| locations rows | plan | total query time |
|---|---|---|
| 601 | seq scan | 1.162 ms |
| 5,001 | seq scan | 1.277 ms |
| 50,001 | seq scan, ~22% of total, and a worse `patients` join plan | 6.628 ms |
| 50,001, indexed | bitmap index scan, chosen unprompted, good join plan restored | 1.130 ms |

ROUND 1'S DECISION REVERSED. I skipped this index then on the reasoning that it was a residual
filter on reference-sized data; the measurements say it is the driving scan, that `locations` is
sized by the whole deployment because `Location` has no facility sync filter, and that the scan
also provokes a planner regression. The index is cheap on a near-static table, so it goes in.

**Integration tests (sonnet, cold)** — 2 suggestions, 1 nit.
- SUGGESTION no test produces two or more non-regular columns, so the server's column sort is never
  exercised. CONFLICTS with the design lens, which found that same sort dead because the PDF
  re-sorts by translated label. The design lens is right — display order is owned where the
  translation happens — so the sort goes, and this test gap goes with it. What remains is a real
  hole: after the removal, nothing automated pins "the remaining diets follow alphabetically by the
  name the sheet shows", because the PDF has no test harness. It was verified by rendering and
  reading the pages, twice. Recorded as a follow-up: a render-level test for the sheet.
- SUGGESTION authorisation is only checked with `asRole('base')` against `asRole('practitioner')`,
  so the first of the four permission checks accounts for every 403 and a regression dropping one
  of the others would pass. The spec calls the minimal set a deliberate choice, and
  `PatientSummary.test.js` pins this kind of boundary with `asNewRole`. → fix now.
- NIT the setting is only ever exercised at facility scope, though the spec says it is set
  deployment-wide with a facility override. → fix now.
- Checked and ruled out: the collation behind the bed ordering (verified against Postgres), all 21
  tests passing, encounter-type inclusion and exclusion, every soft-delete path, the malformed
  `areaId` rejection, and the ignored `facilityId` override.

**Bugs and correctness (sonnet, cold)** — 1 suggestion, REJECTED.
- It asked for `areaId` to be validated as `z.string().uuid()`, to match how other routes validate
  id-shaped fields. NOT TRUE OF THIS FIELD: location group ids are reference data ids, and Tamanu's
  own default provisioning data gives them as `locationgroup-Ward1`, `locationgroup-EDBed` and so
  on. A uuid check would reject every real area id and break the feature outright for every
  deployment. The reviewer even noted the column is `varchar` rather than a native uuid, which is
  the clue it followed past. Not fixed; the reason is carried forward so it is not raised again.
- Checked and ruled out: every soft-delete join and filter, the double-counting dedupe, regular
  column key collisions, the sort re-derivation, the column width arithmetic, the two-pass
  pagination against two existing printouts, facility scoping, permission parity, settings key
  collisions, and the index predicate.

### Round 4 totals (after merging duplicates and triage, before fixes)

critical 1, suggestion 6, nit 3. BES clean. One finding rejected as wrong.

### Round 4 fixes

| Fixer | Owns | Status |
|---|---|---|
| index | `packages/database/` | `c73540f` — partial index on `locations (facility_id)`, applied and verified in the database |
| spec, id and dead sort | spec, `dietSummary.js`, `DietSummaryPDF.jsx` | `e604dd9` — spec id `DIET` → `DIETSUM` with its four code references, the deleted/cancelled/non-diet criterion added, the dead column sort removed |
| modal | `DietSummaryModal.jsx` | running — the dead forbidden branch, focus and announcement for both error states, a real label on the dismiss button |
| tests | `DietSummary.test.js` | running — the permission boundary pinned with `asNewRole`, and the deployment-wide setting scope |

## Round 5 — the cap

Six lenses: bugs, security, design, performance, accessibility and integration tests. BES is not
rerun, having come back clean in rounds 3 and 4. Each brief names the settled decisions it must not
re-raise, and points the reviewer at the newest code — the modal's shared error container and focus
effect, the `isRegular` flag flowing into the PDF's sort, the removed server sort, the second index,
and the test file's permission block and settings teardown.

Standard rigour asks for two clean rounds in a row with the second cold, and the cap is five. Round
5 is the last, whatever it shows: the report says where it stands rather than continuing past it.

### Round 4 checkpoint

Lint PASS · diet summary endpoint tests PASS (28) · settings PASS (97) · shared PASS (226) ·
web unit tests PASS (747) · build PASS. Both indexes confirmed present in the database:
`encounter_diets_encounter_id` and `locations_facility_id_idx`, each partial on
`WHERE deleted_at IS NULL`.

### Round 5 reports

**Design and architecture (fable)** — 4 suggestions, 3 nits, no criticals.
- The shared error container is both the focus and announce target and the layout for the bare
  message, so the forbidden state gets doubled margins and its action row boxed in, and
  `role="alert"` now wraps an interactive Close button. → fix now.
- `MIN_DIET_COLUMN_WIDTH` is a dead abstraction: `if (available < MIN) return available` then
  `Math.min(MAX, available)` is identical to `Math.min(MAX, available)` for every input, so the
  constant and its "readability floor" comment describe a rule nothing enforces. → fix now.
- The spec records neither the no-permission state nor the failure state, both of which the code
  now implements deliberately; `recently-discharged-patients.md` is the house precedent for the
  former. → fix now.
- The handler mixes HTTP concerns with the counting rules, which are only exercisable through
  Postgres; lifting them into a pure function would make them unit-testable. SKIPPED as an optional
  follow-up: they are covered by 28 endpoint tests, and this is a refactor of working code at the
  cap of the loop, not a defect.
- NIT `settingsCache.reset()` in the tests is redundant, since the `Setting` model's hooks already
  reset the cache on every path. → keep, with a line saying it is belt-and-braces; removing it
  risks flakiness for no gain.
- NIT a spec note reads as though it were about sub totals when its referent is three lines up.
  → fix now.
- NIT the branch's two indexes are named inconsistently, `encounter_diets_encounter_id` against
  `locations_facility_id_idx`; the nearest precedent carries no suffix. → fix now.

**Integration tests (sonnet)** — 3 suggestions, no criticals. All → fix now:
- No test asserts `displayId`, `firstName` or `lastName`, though the spec requires patients be
  identified by name and NHN; a swapped or dropped field would pass every test.
- No test creates a diet with `visibilityStatus: HISTORICAL` and checks it still takes a column,
  though the spec states the rule and the analogous retired-bed case is covered. The reviewer notes
  this is an easy regression to introduce, since the suggester endpoints do filter on CURRENT.
- No test admits two patients to one location, though the spec says locations of any occupancy
  count; the grouping is by encounter and looks right, but nothing would catch a future dedupe by
  bed.
- Found no isolation or order problem: the per-test truncation and the reworked two-scope teardown
  hold regardless of shuffle order, and every per-test fixture is uniquely named.

**Bugs and correctness (sonnet)** — 1 suggestion, no criticals.
- The error-focus effect depends only on `isDietSummaryError`, so it fires on the transition into
  an error and never again. The modal instance is never unmounted by its button, so a user who
  lacks the permission gets the same forbidden result on every open, the flag stays true, and focus
  is left wherever it was — the very failure the effect was added for. → fix now, by treating an
  open as a fresh transition.

**Accessibility (sonnet)** — 2 criticals, 1 nit, all on the error container.
- CRITICAL `role="alert"` wraps structurally different content in the two error states, and the
  forced focus lands on the wrapper rather than on the Close button the forbidden state needs.
  WAI-ARIA models `alert` as a passive announcement that never holds focus or owns interactive
  content — `alertdialog` is the role for that — and the sibling `EncounterRecordModal` renders the
  identical forbidden content with neither `role="alert"` nor forced focus.
- CRITICAL the effect never redirects focus on the reverse transition, error → success, which is
  reachable because `refetchOnReconnect` is left at its default, so a network blip that fails and
  then recovers unmounts the focused element and drops focus to `document.body`.
- NIT the in-body "Close" duplicates the accessible name of the dialog's own corner close button;
  the standalone forbidden modal avoids this by labelling its action differently.

**This area has now drawn findings in rounds 3, 4 and 5**, which is the loop's own signal to stop
patching and look at the design. So it is reworked rather than patched again, and the rework rests
on something round 3 changed: `printable` is false while loading, so there is no Print button
during the fetch for focus to be stranded on — VERIFIED in the file. That was the premise the
forced-focus effect was built on, and without it the effect can go entirely: a `role="alert"` on
the plain-text error announces it without moving focus, which is what a live region is for, and
the forbidden state renders as its siblings render it.

**Security (opus)** — 2 suggestions, 2 nits, no criticals.
- SUGGESTION `printable` accounts for the API and certificate fetches but not react-pdf's own
  render: once the data arrives `PDFLoader` reports not loading while the blob is still being
  built, so the Print button is live with no iframe behind it and `printPDF` dereferences null.
  On a facility-wide sheet that window is seconds. → fix now, by guarding the one statement in
  `printPDF`.
- SUGGESTION the extracted `HandoverNotesButton` keeps `keepMounted` on a modal whose query is
  enabled by `areaId` alone, so selecting an Area pulls a whole ward's identifiers, diagnoses and
  notes into the browser before anyone asks for them. FOLLOW-UP, not this card: the behaviour is
  pre-existing and only came into view because this branch moved the code; changing how handover
  notes fetches is beyond the card. The one-line fix is recorded for the author.
- NIT the response carries `encounterId`, used only as a React key. SKIPPED: a server-supplied
  stable key is cleaner than a composite of patient fields, and the response already carries the
  identifiers that matter.
- NIT the `_idx` suffix, raised by the design lens too. → fix now.
- Checked clean: authentication and the permission interceptor, the `asNewRole` boundary tests
  being real, cross-facility bounding (stricter than the neighbouring endpoints), every binding,
  the zod rejection carrying no submitted value, neither error branch rendering a server message,
  no PHI logged, GET-only with bearer auth, and both migrations' predicates and names against the
  baseline.

### Round 5 totals (after triage)

critical 2, suggestion 9, nit 5 — the two criticals both in the error container, which is being
reworked rather than patched a fourth time.

### Round 5 fixes

| Fixer | Owns | Status |
|---|---|---|
| spec | `specs/encounters/diet-summary-sheet.md` | committed — the no-permission and failure states recorded, the note's referent named |
| pdf | `DietSummaryPDF.jsx` | `234b999` — the dead width floor deleted, before and after renders pixel-identical at 4, 20 and 60 columns |
| modal rework | `DietSummaryModal.jsx`, `PDFLoader.jsx` | `27886f1` — the focus effect, ref and shared `role="alert"` container deleted; the forbidden state renders as its sibling does; the plain error is a live region only; `printPDF` guarded |
| migration | `packages/database/` | running — index renamed for consistency |
| tests | `DietSummary.test.js` | running — identity fields, a retired diet, a shared bay |

The shared-bay test first used `maxOccupancy: 2` with `{ validate: false }`. Sent back: the model
rejects anything but 1 or null and its own comment says max occupancy above 1 is unimplemented, so
that fixture asserts against a state no deployment can hold. A real shared bay is
`maxOccupancy: null`, which the model's own availability logic treats as unrestricted, and that is
what the spec means by locations of any occupancy. Redone with `null` and the mutation check
repeated.

**Performance (sonnet)** — 1 critical, 1 suggestion, 1 process nit. Measured, in a rolled-back
transaction at 100k patients, 20.4k locations and 2M encounters (40,572 open deployment-wide
against 530 at the test facility):
- CRITICAL the query resolves "open and eligible" by scanning `encounters_end_date` across every
  facility the server hosts and only then hash-joins down to the one being printed, so its cost
  follows deployment-wide open-encounter volume rather than the facility's. 63.9 ms as written,
  3.5 ms when the plan is driven from the facility's own locations, which lets Postgres BitmapAnd
  `encounters_location_id` with `encounters_end_date`. Multi-facility servers are a supported
  topology and never-closed encounters only accumulate, so this has no ceiling. `encounters` is one
  of the tables the coding rules name explicitly for this. → fix now by rewriting the scoping,
  which needs NO new index on `encounters` since both it relies on already exist.
- SUGGESTION the new `locations (facility_id)` index does not serve the single-ward branch — the
  one the spec calls the filter that narrows the sheet. At 6,029 locations across 14 wards Postgres
  seq-scans instead, because `location_group_id` is only a residual filter; a composite
  `(facility_id, location_group_id)` drops the cost from 395 to 244 with nothing removed by filter.
  → fix now, widening the index this branch already adds.
- NIT (process) the branch moved under the reviewer mid-round, including transient mutation states
  from the test agent. Fair, and it read them correctly as transient. The final state is verified
  by the closing checkpoint rather than by the round's diff.

The query rewrite landed with its own honest caveats, worth carrying to the report:
- The predicted BitmapAnd did not appear. Postgres 18.4 picks a plain index scan on
  `encounters_location_id`, so the cost is now bounded by the facility's own bed history rather
  than by the deployment — the intended change, by a different plan from the one predicted.
- The single-area case is a wash, not a win: with an area applied the old form already drove from
  `locations`.
- One regression shape: `location_id = ANY($array)` estimates 16–26 rows whatever the array holds,
  so for a sheet of thousands of rows the downstream joins stay nested loops. At a synthetic
  facility with a 3,600-row sheet, old 13.9 ms against new 20.0 ms. At a realistic sheet of
  hundreds of inpatients the new form wins, and it scales far better with deployment size
  (12.4 ms against 4.70 ms at 157,731 deployment-wide open encounters). Accepted on that basis,
  and flagged for the author.
- `IN (subquery)` was measured and does not work: Postgres flattens it to a join and plans exactly
  as before.

### Closing checkpoint

Working tree clean · lint PASS · diet summary endpoint tests PASS (30) · settings PASS (97) ·
shared PASS (226) · web unit tests PASS (747) · build PASS. Indexes in the database:
`encounter_diets_encounter_id` and `locations_facility_id_location_group_id`, both partial on
`WHERE deleted_at IS NULL`.

The full facility-server suite reported 16 failures: the 14 known pre-existing ones, plus three
files an earlier full run of this same branch did not report — the two mSupply processors and one
imaging-invoice case in `EncounterInvoice.test.js`. Under investigation rather than assumed either
way: the question is whether the new `bedManagement` settings subtree, the two new indexes, or test
pollution explains them, or whether they are flaky.

**The three extra failures are not this branch's.** `EncounterInvoice.test.js` did not fail on three
repeat runs with different seeds — flaky. Both mSupply files fail identically on `main` and on the
branch, with the same error and stack: they mock `getServerFacilityIds` to `['balwyn']` to match
`config/test.json5`, but this machine's gitignored `config/local.json5` overrides
`serverFacilityIds` to `["facility-1"]`, which node-config applies first, so `createApiApp` looks up
`settings['balwyn']` and finds nothing. A machine-local config mismatch. Every file in that path is
byte-identical to `main` on this branch.

## Where the run ended

Five rounds, the cap for standard rigour. The rigour asks for two clean rounds in a row with the
second cold, and the run did not get there: round 5 found two criticals, both in the modal's error
container, and the rework that answered them has not itself been through a round. Three of the
seven lenses came back clean at least once — performance and bugs in round 3, BES requirements in
rounds 3 and 4 — and four did not: security, design, accessibility and integration tests.

The closing checkpoint is green and every finding filed is fixed, skipped with a reason, or carried
as a follow-up or a decision for the author. What is not established is a clean round over the final
state.
