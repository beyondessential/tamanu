# Logic Bug Audit — Triage Classification

Classification of the findings from `LOGIC_BUGS_AUDIT.md` (PR #10266) that remain
open after the first remediation batch. Every finding below was re-verified
against `origin/main` (commit `891a649`, 2026-07-13): each one's defective code
was confirmed still present unless noted otherwise.

Finding IDs (C2, F8, W15, M9, …) refer to the audit document on the PR #10266
branch.

## Status corrections to the audit

- **F4 (patientPayment.js transaction misuse) is already fixed** — #10275
  ("run invoice and payment writes inside their transaction") converted the
  payment handlers to managed transactions along with F3. The audit only marks
  F3; F4's marker should be added.

All findings marked ✅ in the audit are actioned (merged or queued) and excluded
from this classification.

---

## 1. Testable bugs — fix now, with regression tests

Small, localised fixes (mostly one to a few lines) where a regression test slots
into an existing suite or an established sibling pattern. 35 findings.

### Server

| ID | Bug (one line) | Fix sketch | Test siting |
|---|---|---|---|
| C2 | Repeating-task generation counts the whole table (`endTime` filter not under `where:`) and re-fetches the same first batch (no offset) | Move filter under `where:`, add `offset`/`order` like `GenerateMedicationAdministrationRecords` | New `central-server/__tests__/tasks/GenerateRepeatingTasks.test.js`, modelled on `GenerateMedicationAdministrationRecords.test.js` |
| C3 | Lab-result auto-publisher reads `config.limit` from the wrong config → no cap | Read the task's own config (`limit ?? 300`) | Extend `__tests__/tasks/automaticLabTestPublisher.test.js` |
| C5 | `absoluteExpiration` refresh mode uses `contents.exp` (undefined) → `/refresh` 500s when enabled | Use `contents.payload.exp` | Extend `central-server/__tests__/auth/refresh.test.js` |
| C6 | Portal one-time codes never contain the digit 9 (`randomInt(0, 9)` upper bound exclusive) | `randomInt(0, 10)` | Unit test on `PortalOneTimeTokenService` (distribution/keyspace) |
| C8 | Survey-response importer rejects/drops legitimate numeric `0` answers (`!answer` / `if (answer)`) | `answer == null` / explicit null checks | New importer test alongside the existing admin importer suites |
| C9 | Report-failure email unawaited and body passed as `message:` (ignored by nodemailer) | `await sendEmail({ …, text: })` | Unit test with mocked email service in the ReportRunner tests |
| C10 | DeceasedPatientDischarger batch loop stalls on skip-rows (limit, no offset) and null-derefs `getClinician()` | Offset-based batching + null guard | Extend `__tests__/tasks/outpatientDischarger.test.js` pattern (sibling file) |
| F2 | Rescheduling counts CANCELLED bookings in the conflict check → spurious `EditConflictError` | Add the `status: { [Op.not]: CANCELLED }` filter the create handler already has | Extend `facility-server/__tests__/apiv1/Appointments.test.js` |
| F8 | Sync pull destructures the last record before the empty-page guard → `TypeError` fails the session | Move the `!records.length` break above the destructure | New unit test for `pullIncomingChanges` with a mocked central (no existing file) |
| F9 | Imaging area-note response reads `.content` off a plain string → always `''` | Return `areaNote` directly | Extend `__tests__/apiv1/ImagingRequests.test.js` |
| F10 | Five early-exit handlers missing `return` before `res.send` → double send / null-deref crash (`encounter.js`, `patientRelations.js` ×2, `patientProgramRegistration.js`, `patientVaccine.js`) | Add `return`s | Extend the matching route test files (the program-registration `/history` null-registration case is the must-have test) |
| F11 | MAR update crashes when `doses` omitted (`doses.length` vs the schema's optional `doses`) | `doses?.length` | Extend `__tests__/apiv1/Medication.test.js` |
| D2 | Server-side survey submit computes result from raw `answers` instead of `finalAnswers` → calculated results lost | Pass `finalAnswers` (matches mobile) | Extend `central-server/__tests__/models/SurveyResponse.test.js` |
| S3 | `dateParts` tz branch normalises `tz` (always null) instead of `withTz` → offset silently dropped (latent — no current reader of `.tz`) | Pass `withTz` | Unit test in shared fhir datetime tests |
| U1 | Monthly-repeat ordinal weekday parsed as UTC (`new Date(date)`) vs local (`parseISO`) → wrong week in UTC-negative TZs | `parseISO(date)` | New unit test for `appointmentScheduling.ts` (pure function; no existing file) |
| U2 | Printed-invoice remaining balance subtracts refunded payments → contradicts the summary on the same PDF | Net out refunds (payments with `originalPaymentId`) like `getInvoiceSummary` | Extend `utils/__test__/invoice.test.ts` |
| SC1 | Deploy web-replica counts copy-pasted from DB-replica options (`centraldbs`/`facilitydbs`) | Use `centralwebs`/`facilitywebs` | Extend `scripts/tests/ghaCdHelpers.test.mjs` |

### Web (Vitest + testing-library in `packages/web/__tests__/`)

| ID | Bug (one line) | Fix sketch |
|---|---|---|
| W3 | Normal-range column crashes for sex `other` and treats `min: 0` as absent | Guard missing range; `!= null` checks |
| W9 | `TIME_UNIT_OPTIONS.sort()` mutates the shared constant → death-certificate durations default to "years" | Copy before sorting (`[...TIME_UNIT_OPTIONS]`) |
| W10 | LocationBookings initial filter state is `{ LOCATION_BOOKINGS_EMPTY_FILTER_STATE: {…} }` (shorthand vs spread) | Spread the constant |
| W11 | `isLoadingEncounter` sticks true if the primary encounter fetch rejects | try/finally around the fetch |
| W12 | DiagnosisForm offers the triage-only "ED Diagnosis" certainty on regular encounters | Exclude `TRIAGE_ONLY` when `!isTriage` |
| W13 | Report load-failure message interpolates a React element → `[object Object]` | Compose the message without stringifying the element |
| W14 | DischargeForm ongoing-meds table drops the `canWriteSensitiveMedication` argument | Pass the 5th arg (the encounter-meds call above is the template) |
| W16 | ChartForm builds validation from all components but renders only visible ones → unsubmittable form | Validate `visibleComponents` (matches VitalsForm), pass `{ encounterType }` |
| W17 | TaskForm keeps a stale `frequencyValue` when switching to a once-off template | Clear the field when the template has no frequency |
| W19 | ProgramRegistry "Related conditions" sorts Z→A (swapped comparator args) | `a.localeCompare(b)` |
| W22 | DateSelector arrow-key handler bound to the whole toolbar; sibling `.focus()` can throw | Scope handler to the date strip; null-guard siblings |

### Mobile (Jest in `packages/mobile`)

| ID | Bug (one line) | Fix sketch | Test siting |
|---|---|---|---|
| M4 | Per-day encounter report filters `deviceId` in `HAVING` on a non-aggregated column | `.andWhere(...)` like the sibling queries | `App/models/Encounter.spec.ts` |
| M5 | Offline login dereferences `user.password` before the `!user` check → TypeError for unknown email | Reorder the guard | `App/services/auth/AuthService.test.ts` |
| M6 | Incoming tombstones store the literal string `datetime('now')` as `deletedAt` | Format a real local ISO 9075 timestamp | New `buildFromSyncRecord` test (sibling sync-util tests exist) |
| M7 | PAD insert branch checks `this[snakeCase(key)]` (always undefined) → field ticks never recorded on insert | Use the camelCase key | New `PatientAdditionalData` model test (sibling model specs exist) |
| M12 | Village mandatory validation keyed on `village`/`fields.village` while the field and setting are `villageId` | Use `villageId` (cf. `religionId` on the next line) | Schema unit test |
| M13 | Registration-date picker uses `min={new Date()}` — blocks all past dates | `max={new Date()}` | Component test / covered by the same form's existing tests if any |
| M14 | `formatPlainTime` renders 12:30pm as "00:30pm" (`hour % 12` without `|| 12`) | Add the 12-hour correction | `App/ui/helpers/date.spec.ts` |

---

## 2. Higher-complexity bugs — file as BAU work

Real defects whose fix needs design thought, cross-cutting changes, or a product
decision; not sensibly "fixed today" alongside a quick regression test. 9 findings.

| ID | Bug | Why BAU rather than quick-fix |
|---|---|---|
| D4 | Sensitive-facility sync restriction missing on `MedicationDispense`, `PharmacyOrderPrescription`, `Vitals` lookup filters → sensitive pharmacy/dispense/vitals rows sync to regular facilities | Sync-lookup filter change with data-leak implications: needs `buildEncounterLinkedLookupFilter` adoption, a sync_lookup rebuild/backfill story, and verification across facility types. **Suggest scheduling this one first — it is a sensitive-data leak.** |
| C7 | Snapshot-timeout guard `throw`s inside a `setTimeout` callback → uncatchable, kills the whole central server when `snapshotTransactionTimeoutMs` is set | Needs a proper cancellation design (reject the awaited promise / abort the transaction), not a one-liner; config-gated (default off) so not urgent |
| S4 | Report `SurveyAnswer` source resolution looks up components by data-element code with no survey/program scoping | Requires deciding the correct scoping (survey? program? ordering?) and checking existing report definitions for reliance on current behaviour |
| W15 | DischargeForm unsaved-changes warning / save-draft flow is entirely dead code — cancelling silently discards all entered discharge data | Effectively an unshipped feature: needs wiring the warning screen and draft persistence end-to-end, plus a product decision on the intended UX |
| W18 | Editing a medication set item swaps its administration times for the setting defaults | Needs an `idealTimes` → `timeSlots` mapping on form init and care not to regress create mode |
| W20 | Location-booking clinician prefill compares primary-TZ stored times against facility wall-clock slots | Timezone-aware refactor using the `useDateTime` helpers; needs multi-TZ test setup |
| W21 | ProgramsView survey-list fetch has no staleness guard → surveys recorded against the wrong program | Correct fix is request-sequencing or migrating the fetch to react-query; racy behaviour is awkward to lock down with a quick test |
| M8 | Mobile hierarchy suggester passes raw rows to a filter expecting entities → cascading dropdowns always empty | Needs the suggester query to return entities (or the filter contract changed); suggester is shared infrastructure |
| M9 | Queued mobile sync never emits `SYNC_ENDED` → `waitForCurrentSyncToEnd()` can hang; `isQueuing` never reset on throw | Sync-manager lifecycle/concurrency semantics need restructuring, not a spot fix; regression risk in sync is high |

---

## 3. Low-impact bugs — file as techdebt

Real but low-impact (latent, masked, rarely-exercised, or cosmetic-adjacent);
work through at the reduced techdebt cadence. 4 tickets (one is a cluster).

| ID | Bug | Why techdebt |
|---|---|---|
| C4 | Report child-process exit cleanup never registered (array event name, wrong `kill` signature) → orphaned report processes on server restart | Operational annoyance only; process-signal behaviour is hard to regression-test meaningfully |
| D3 | `makePatientOngoingPrescriptionIdDeterministic` migration mixes DML+DDL (both `up` and `down`) on an audited table | Migration already shipped; `down` is rarely run in production. Fix by splitting/marking `// DESTRUCTIVE` per `packages/database/CLAUDE.md` next time the file is touched |
| S2 | FHIR JSONB search `INVERSE_OPS` maps comparisons to their complement instead of converse | Currently masked (only day-precision date params reach this branch) — zero user impact today; fix + tests when a same-precision/numeric JSONB param is added, or opportunistically |
| W25 | Admin/report-editor cluster: report `name`/param ids leak into `queryOptions`; `Math.random()` React keys drop focus; `parameters.map` crash; "Created time" column shows `updatedAt`; `Number('')`→0 on cleared numeric settings; `recursiveJsonParse` mangles JSON-looking strings | Admin-only papercuts with workarounds; batch into one techdebt ticket so they're fixed together in the editor code |

---

## Suggested next steps

1. Mark F4 as fixed in the audit (covered by #10275).
2. Schedule D4 (sensitive-data sync leak) at the front of the BAU queue.
3. Batch the section-1 fixes into small per-package PRs (task fixes, facility
   route fixes, web form fixes, mobile fixes) — each finding above names the
   suite its regression test belongs in.
