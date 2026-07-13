# Tamanu Logic Bug Audit

A per-package audit for logic bugs that would significantly impact functionality
(not style, missing features, or theoretical nitpicks). Each package was swept
systematically; every finding below was verified against the surrounding code and
callers, and a representative sample across all severity tiers was additionally
re-confirmed against source by hand.

Severity = product impact. Confidence = how certain the defect is.

**Resolution:** every finding is now actioned. ✅ marks a fix PR (first
remediation batch #10267–#10289, second batch #10318–#10356 — each second-batch
PR carries a regression test verified to fail before the fix). 📋 marks a
higher-complexity finding filed as BAU work in Linear. 🧹 marks a low-impact
finding tracked on the techdebt cooldown board. See `LOGIC_BUGS_CLASSIFICATION.md`
for the triage rationale.

**Summary of counts**

| Package | Critical | High | Medium |
|---|---|---|---|
| central-server | 1 | 1 | 8 |
| facility-server | 1 | 5 | 5 |
| database | 0 | 1 | 3 |
| shared | 0 | 1 | 3 |
| settings | 1 | 0 | 0 |
| api-client | 0 | 1 | 0 |
| utils | 0 | 0 | 2 |
| scripts | 0 | 0 | 1 |
| web (views/forms/components) | 0 | 7 | 14 |
| mobile | 1 | 4 | 9 |

---

## Highest-priority (fix first)

These are the ones with the widest blast radius or the clearest clinical/data-integrity impact. All seven are now fixed (see the ✅ markers on the individual findings):

1. **settings/buildSettings.ts** — settings cascade mutates the shared schema-default singletons; deleted settings never revert and one facility's overrides leak to another. (critical)
2. **mobile/SurveyResponse.ts** — survey submit's try/catch is *inside* the DB transaction, so a mid-submit error commits partial clinical data and the UI reports failure → duplicate/partial records. (critical)
3. **central-server/loadshedder.js** — inverted queue filter on timeout evicts every *other* queued request. (critical)
4. **facility-server/patientLocations.js** — SQL injection via `facilityId` query param. (critical)
5. **facility-server/invoices.js & patientPayment.js** — `destroy`/`update` transaction arg ignored → "rolled back" writes actually commit → invoice/payment data loss. (high)
6. **web/EncounterView + panes** — discharged-encounter / deceased-patient read-only gating is inert (prop-name mismatch); clinical actions stay enabled. (high)
7. **mobile/Encounter.ts & MedicationAdministrationRecord.ts** — UTC-vs-local datetime mishandling corrupts "current encounter" grouping and MAR due times. (high)

---

## packages/central-server

### C1 — loadshedder evicts all other queued requests on a single timeout `[critical, HIGH]` — ✅ Fixed in #10267
`app/middleware/loadshedder.js:76` (also `:97`)
The queue-timeout `cancel` handler filters with `filter(j => j === request)`, which
**keeps only the timed-out request and discards every other queued request**. Evicted
requests are no longer reachable by `release()`, so as capacity frees they are never
started — each waits out its own full `queueTimeout` and 429s instead of being served.
`release()` also uses `pop()` (LIFO), starving the oldest waiters. The loadshedder is
enabled by default on `/api/sync`, `/api/attachment`, and `/`.
Fix: `filter(j => j !== request)`; use `shift()` in `release()`.

### C2 — repeating-task generation only ever processes the first batch `[high, HIGH]` — ✅ Fixed in #10319
`app/tasks/GenerateRepeatingTasks.js:116-121,140-152`
`Task.count({ endTime: null, ... })` passes the filter at the top level instead of under
`where:`, so it counts every task in the table. The batch loop then calls
`findAll({ where, limit: batchSize })` with **no offset/order**, and parent tasks never
leave the filter (generating children doesn't clear `endTime`), so every iteration
refetches the same first 50 parents. Repeating tasks beyond the first `batchSize` never
get child tasks generated. Compare `GenerateMedicationAdministrationRecords.js`, which
uses `offset: i * batchSize`.

### C3 — `AutomaticLabTestResultPublisher` ignores its configured limit `[medium, HIGH]` — ✅ Fixed in #10318
`app/tasks/AutomaticLabTestResultPublisher.js:17`
`this.limit = config.limit` reads the top-level `config` module (no `limit` key) instead
of the task's config (`schedules.automaticLabTestResultPublisher.limit`, default 300).
`this.limit` is always `undefined`, so the publish query runs with no cap — after a
backlog it can publish tens of thousands of results in one run.

### C4 — report child-process exit cleanup never runs `[medium, HIGH]` — 🧹 Techdebt (cooldown board)
`app/tasks/ReportRequestProcessor.js:31-40`
`process.on(['uncaughtException','SIGINT','SIGTERM'], fn)` passes an array as the event
name, so no handler is ever registered. Even if it fired, `childProcess.kill(childProcess.pid, event)`
uses the wrong signature (`kill([signal])`). Long-running report child processes are
orphaned on server restart.

### C5 — `absoluteExpiration` refresh-token mode 500s on every refresh `[medium, HIGH]` (config-gated, default off) — ✅ Fixed in #10321
`app/auth/refresh.js:102-116`
`contents.exp` is `undefined` (the value lives at `contents.payload.exp`), and omitting
`expiresIn` makes `buildToken`'s unconditional `.setExpirationTime(undefined)` throw.
Enabling `auth.refreshToken.absoluteExpiration` makes `/refresh` 500 for all clients.

### C6 — patient-portal one-time codes never contain the digit 9 `[medium (security), HIGH]` — ✅ Fixed in #10320
`app/patientPortalApi/auth/PortalOneTimeTokenService.js:10-13`
`randomInt(0, 9)` — the upper bound is exclusive — yields digits 0–8 only, shrinking the
6-digit login-code keyspace from 10⁶ to 9⁶ (~47% smaller). Fix: `randomInt(0, 10)`.

### C7 — snapshot-timeout guard crashes the whole process `[medium, HIGH]` (config-gated, default null) — 📋 Filed as [TAM-6967](https://linear.app/bes/issue/TAM-6967)
`app/sync/CentralSyncManager.js:524-529`
The guard `throw`s from inside a `setTimeout` callback, which can't be caught by the
surrounding try/catch and (given C4's broken handler) becomes an uncaught exception. A
slow snapshot with `sync.snapshotTransactionTimeoutMs` set kills the server instead of
erroring one session.

### C8 — survey-response importer treats numeric `0` as "no answer" `[medium, HIGH]` — ✅ Fixed in #10322
`app/admin/surveyResponsesImporter/importSurveyResponses.js:70-83,172-187,352`
Mandatory check uses `!answer` (throws "Value is mandatory" for a legitimate `0`), and
`if (answer) answers[...] = answer` silently drops any validated `0`. Importing e.g.
"number of previous pregnancies = 0" either fails validation or loses the answer.

### C9 — report-failure email is unawaited and uses the wrong body key `[medium, MEDIUM]` — ✅ Fixed in #10323
`app/report/ReportRunner.js:284-299`
`sendErrorToEmail` doesn't `await` `sendEmail` (the child process exits before it sends,
and errors are uncatchable) and passes the body as `message:` instead of `text:`
(nodemailer ignores it), so the "your report failed" email is usually lost or empty.

### C10 — `DeceasedPatientDischarger` can stall permanently `[medium, MEDIUM]` — ✅ Fixed in #10325
`app/tasks/DeceasedPatientDischarger.js:56-91`
Batch loop uses `limit` with no offset; rows that hit a `continue` (patient with
`dateOfDeath` but no `PatientDeathData`) never leave the filter, so once such skip-rows
reach `batchSize`, every batch returns only them and no one else is auto-discharged. Also
`patientDeathData.getClinician()` is dereferenced (`discharger.id`) with no null check.

---

## packages/facility-server

### F1 — SQL injection via `facilityId` in bed-occupancy queries `[critical, HIGH]` — ✅ Fixed in #10268
`app/routes/apiv1/patient/patientLocations.js:20` (used at `:34-45`, `:147-177`)
`WHERE locations.facility_id = '${facilityId}'` interpolates the request query param
straight into SQL. Sibling endpoints in the same file use `$facilityId` binds. Any
authenticated user can inject arbitrary SQL. Fix: parameterise with a bind.

### F2 — reschedule conflict check counts CANCELLED bookings `[high, HIGH]` — ✅ Fixed in #10324
`app/routes/apiv1/appointments.js:593-611`
The create handler excludes cancelled bookings from the overlap check
(`status: { [Op.not]: CANCELLED }`); the update (reschedule) handler omits that filter.
Rescheduling into a slot freed by a cancellation matches the cancelled row and throws
`EditConflictError`, even though creating a new booking there succeeds.

### F3 — invoice update deletes run outside the transaction `[high, HIGH]` — ✅ Fixed in #10275
`app/routes/apiv1/invoice/invoices.js:259-324`
An **unmanaged** transaction is opened (`req.db.transaction()`, so CLS doesn't bind it),
then `InvoiceDiscount/InvoiceItem/InvoiceItemDiscount.destroy({ where }, { transaction })`
is called — but `Model.destroy(options)` takes a single argument, so the transaction is
ignored and every delete commits immediately in autocommit. On a later failure,
`transaction.rollback()` restores nothing → invoice items/discounts permanently lost.

### F4 — patient-payment writes escape their transaction `[medium, HIGH]` — ✅ Fixed in #10275
`app/routes/apiv1/invoice/patientPayment.js:106-118,154-187`
Same misuse: `Model.update(values, { where }, { transaction })` — `update` takes two
arguments, so the transaction is ignored. In the update handler all three writes escape
the unmanaged transaction, so the rollback protects nothing → inconsistent payment records
on partial failure.

### F5 — admitting from a referral never links the referral to the encounter `[high, HIGH]` — ✅ Fixed in #10274
`app/routes/apiv1/encounter.js:104,171-176` + `createEncounter.schema.ts`
The PUT handler destructures `referralId` from `params`, but the route is `/:id` (no such
param) → the referral-linking block is unreachable. The web client sends `referralId` in
the POST body, but `createEncounterSchema` strips it and the POST handler has no linking
logic. Net: the referral is marked COMPLETED but `referrals.encounter_id` is never set.

### F6 — vaccine creation proceeds after a 400 (missing `return`s) `[high, HIGH]` — ✅ Fixed in #10272
`app/routes/apiv1/patient/patientVaccine.js:225-231`
Both validation failures call `res.status(400).send(...)` without `return`. Execution
continues to create the encounter and `AdministeredVaccine` record, then crashes with
`ERR_HTTP_HEADERS_SENT` — the client is told the request was rejected while a phantom
vaccine record (with null `scheduledVaccineId`) is persisted.

### F7 — panel lab requests bypass the sensitive-test permission check `[high, MEDIUM]` — ✅ Fixed in #10285
`app/routes/apiv1/labs.js:102-126,813-866`
The POST `/` sensitive check queries only the explicitly supplied `labTestTypeIds`
(default `[]`). Panel test types are resolved server-side from `panel.labTestTypes` and
never checked against `isSensitive`, so `create SensitiveLabRequest` is skipped for panels
— a user without that permission can create a lab request containing a sensitive test.

### F8 — sync pull crashes on an empty page `[medium, HIGH]` — ✅ Fixed in #10326
`app/sync/pullIncomingChanges.js:36-48`
`const { id, sortOrder } = records[records.length - 1]` runs **before** the
`if (!records.length) break` guard, so an empty page throws `TypeError` and fails the
sync session; the "no more changes" break is unreachable. Empty final pages are reachable
when the central `totalToPull` count diverges from the dependency-ordered pull query.

### F9 — imaging area-note update returns an empty string `[medium, HIGH]` — ✅ Fixed in #10328
`app/routes/apiv1/imaging.js:219-223`
The response is built from `areaNote.content || ''`, but `areaNote` is a plain string from
the body, so `.content` is always `undefined` → response `areaNote` is always `''`. The DB
update is correct; the UI shows the note as blank until a refetch. (The sibling `note`
branch correctly uses `otherNote.content`.)

### F10 — early-exit handlers missing `return` → double `res.send`/crash `[medium, HIGH]` — ✅ Fixed in #10333
`encounter.js:649-654`, `patient/patientRelations.js:227-232,320-325`,
`patient/patientProgramRegistration/patientProgramRegistration.js:338-343`,
`patient/patientVaccine.js:410-414`
Each early-exit `res.send({ data: [], count: 0 })` lacks `return`, so the handler
continues into a second query (with empty/`null` inputs) and a second `res.send`. The
`.../history` case dereferences `registration.id` on a null registration → guaranteed
crash for any patient with no registration.

### F11 — MAR update crashes when `doses` omitted `[medium, MEDIUM]` — ✅ Fixed in #10329
`app/routes/apiv1/medication.js:1476`
`updateMarSchema` marks `doses` optional and line 1455 guards with `doses?.length`, but
line 1476 uses `doses.length`. A PUT with only `{ isError, errorNotes }` (valid per schema)
throws `TypeError` inside the transaction → 500 and the medication-error flag is rolled back.

---

## packages/database

### D1 — inpatient-bundled invoice quantity skips unit conversion `[high, HIGH]` — ✅ Fixed in #10276
`src/models/Prescription.ts:359-374` (vs `:343-352`)
`recalculateAndApplyInvoiceQuantity`'s normal path converts dosing→dispensing units
(`Math.ceil(totalDosingAmount / unitConversion)`), but the inpatient-fee-bundled branch
sums raw `doseAmount` with **no division and no ceil**, mixing dosing units into a
dispensing-unit invoice quantity. With `unitConversion = 250` (mg/tablet), two 250 mg
doses bill `500` tablets instead of `2`. The bundling test only uses `unitConversion = 1`,
masking it.

### D2 — recalculated survey results discarded on server-side submit `[medium, HIGH]` — ✅ Fixed in #10331
`src/models/SurveyResponse.ts:400-420`
`createWithAnswers` builds `finalAnswers` (raw + `calculatedAnswers`) but calls
`getResultValue(questions, answers, …)` with the **raw** `answers`. Result/Calculated
values only exist in `calculatedAnswers`, so when the client didn't pre-compute them
(patient-portal submission, admin import) the stored `result`/`resultText` is empty/0. The
mobile equivalent correctly passes `finalValues` — a divergence in code marked "keep in sync".

### D3 — `down` migration mixes DML+DDL on an audited table `[medium, HIGH]` — 🧹 Techdebt (cooldown board)
`src/migrations/1770250000001-makePatientOngoingPrescriptionIdDeterministic.ts:57-73`
The `down` runs `UPDATE …` then `ALTER TABLE … DROP …` on `patient_ongoing_prescriptions`
(which has a deferred changelog trigger) in one batch → "cannot ALTER TABLE … because it
has pending trigger events". It's effectively irreversible on any populated DB and isn't
marked `// DESTRUCTIVE` or split, contrary to `packages/database/CLAUDE.md`.

### D4 — sensitive-facility sync restriction missing on pharmacy/dispense children `[medium, MEDIUM]` — 📋 Filed as [TAM-6966](https://linear.app/bes/issue/TAM-6966)
`src/models/MedicationDispense.ts:76-86`,
`src/models/PharmacyOrderPrescription/PharmacyOrderPrescription.ts:121-127`,
`src/models/Vitals.ts:103-108`
The parent `PharmacyOrder` uses `buildEncounterLinkedLookupFilter` (which stamps
`sync_lookup.facility_id` for sensitive encounters, restricting sync to the originating
facility), but these child rows use `buildEncounterPatientIdSelect` (facility_id NULL, no
facilities join) → their lookup rows are never facility-restricted, leaking sensitive
pharmacy/dispense data to regular facilities.

---

## packages/shared

### S1 — `programRegistry` suggester registered twice with contradictory filters `[high, HIGH]` — ✅ Fixed in #10289
`src/services/suggestions/suggestions.js:1056-1089` vs `:1109-1142`
Two registrations for the same route; Express serves only the first. The live route
excludes registries where the patient has any registration `!= recordedInError` (blocks
both active **and** removed/inactive), while the dead duplicate excludes only `active`.
One of these is an intended behaviour change that silently never took effect — e.g. staff
may be unable to re-register a patient previously removed from a registry.

### S2 — FHIR JSONB comparison operators use complement instead of converse `[medium, MEDIUM]` — 🧹 Techdebt (cooldown board)
`src/routes/fhir/search/where.js:39-52`
For JSONB-path search params the clause is flipped to `value <op> ANY(...)`, and
`INVERSE_OPS` should map each comparison to its **converse** but maps to the **complement**
(`gte→lt` instead of `gte→lte`, etc.), inverting every boundary (`ge` acts as strict `>`).
Currently masked because only day-precision date params hit this branch; breaks the moment
a same-precision or numeric JSONB param is added.

### S3 — wrong variable drops the timezone in `dateParts` `[medium, HIGH]` — ✅ Fixed in #10332
`src/utils/fhir/datetime.js:54-58`
In the `withTz` branch, `tz = normalizeTz(tz, date)` but `tz` is always `null` there
(intended: `withTz`). `normalizeTz(null, …)` → NaN → returns null, so `value.tz` is always
null when a datetime without an explicit offset is parsed with a supplied timezone. Current
callers only read `.plain`, but any future `value.tz` consumer silently loses the offset.

### S4 — `SurveyAnswer` source resolution is unscoped `[medium, MEDIUM]` — 📋 Filed as [TAM-6968](https://linear.app/bes/issue/TAM-6968)
`src/reports/utilities/transformAnswers.js:128-144`
For `SurveyAnswer`-type questions the source component is looked up by data-element `code`
with **no survey/program scoping and no ordering**. If the same code exists in multiple
surveys, an arbitrary component's `config` is used to interpret the answer → wrong
reference-data resolution ("Selected answer not found" aborts the export, or a wrong
display value).

---

## packages/settings

### SET1 — settings cascade mutates the shared default singletons `[critical, HIGH]` — ✅ Fixed in #10269
`src/reader/buildSettings.ts:25-39` + `src/reader/readers/SettingsJSONReader.ts`
`settings = mergeWith(value, settings, …)` — es-toolkit/compat `mergeWith` **mutates and
returns its first argument**. `SettingsJSONReader.getSettings()` returns the module-level
singleton (`facilityDefaults`/`globalDefaults`) by reference, so every `buildSettings`
call deep-merges all DB settings **into the shared defaults**, and the returned object
*is* the `globalDefaults` singleton. Consequences: (a) deleting/reverting a setting in the
admin panel has no effect until process restart; (b) on a multi-facility server, facility
A's overrides bake into the defaults and are served to facility B; (c) cached per-facility
settings objects all alias the same mutated singleton. Fix: merge into a fresh accumulator
(`mergeWith({}, value, settings, …)` or clone the JSON payloads).

---

## packages/api-client

### A1 — `stream()` yields a corrupt message on mid-message disconnect `[high, HIGH]` — ✅ Fixed in #10277
`src/TamanuApi.ts:722-743` (bad yield at `:736`)
When the reader reports `done` with a partial **non-END** message buffered (header read,
payload truncated), the code falls through to `yield { kind, message }` with
`message === undefined` before breaking to retry. The sync-pull consumer does
`records.push(message); fromId = message.id` → `TypeError` on `message.id`, erroring the
session and defeating the `fromId`-based resume that exists precisely for this case.
Fix: treat a partial non-END message the same as `!kind` (warn + break to retry).

---

## packages/utils

### U1 — monthly-repeat ordinal weekday parsed as UTC while weekday parsed as local `[medium, MEDIUM]` — ✅ Fixed in #10334
`src/appointmentScheduling.ts:54`
`getNextFrequencyDate` computes `dayOfWeek` via `parseISO(date)` (local) but `nthWeekday`
via `getWeekdayOrdinalPosition(new Date(date))` (a date-only string parses as **UTC**
midnight). In any UTC-negative runtime (much of the Pacific/Americas), `new Date('2024-03-08')`
is the local previous day, so the ordinal weekday is off by one → monthly repeating
appointments / location assignments land on the wrong week. Fix: `parseISO(date)`.

### U2 — printed invoice "remaining balance" ignores refunds `[medium, HIGH (internal inconsistency)]` — ✅ Fixed in #10336
`src/invoice/payments.ts:65-79,86-103`
`getInvoiceSummary` nets out refunds, but `getPatientPaymentsWithRemainingBalance` (used by
the printed invoice record) filters only on `patientPayment.id` and subtracts **every**
such payment. A $100 payment that was refunded still counts, so the payments table shows
remaining balance `$0.00` while the summary on the same PDF shows `$100` owing — an
internally contradictory financial document. Same in the insurer variant.

---

## packages/scripts

### SC1 — deploy web-replica counts copied from DB-replica options `[medium, HIGH]` — ✅ Fixed in #10335
`src/ghaCdHelpers.mjs:308,313`
`centralWebReplicas: options.centraldbs` / `facilityWebReplicas: options.facilitydbs`
(copy-paste; should be `centralwebs`/`facilitywebs`). The `centralwebs`/`facilitywebs`
options are defined but never consumed, so web replica counts silently track DB counts
(bounds [2,3]) and can't be set independently on a deploy line.

---

## packages/web

### W1 — discharged/deceased read-only gating is inert `[high, HIGH]` — ✅ Fixed in #10273
`views/patients/EncounterView.jsx:178,297` + `PatientView.jsx:184,243` + all encounter panes
`EncounterView` computes `disabled = encounter?.endDate || !!patient.dateOfDeath` and passes
it as `disabled`, but every pane destructures a prop named **`readonly`**
(`VitalsPane`/`LabsPane`/`ImagingPane`/`NotesPane`/`ProcedurePane`/`EncounterMedicationPane`/
`VaccinesPane`). `readonly` is never supplied → always `undefined` → "Record vitals",
"New lab request", "New note", etc. stay enabled on discharged encounters and deceased
patients — exactly what the gating was meant to prevent. `ChartsPane` declares `readonly`
in propTypes, confirming the intended contract.

### W2 — saving a completed imaging request creates a blank result each time `[high, HIGH]` — ✅ Fixed in #10282
`views/patients/imagingRequest/ImagingRequestView.jsx:278-287`
`initialValues` always sets `newResult: { completedAt: getCurrentDateTime() }`, and
`onSubmit` attaches `newResult` whenever `status === COMPLETED` regardless of user input.
The server creates an `ImagingResult` whenever `newResult?.completedAt` is truthy, so every
save of a completed request appends an empty result row (blank description/completed-by,
page-load timestamp). Repeats on each save.

### W3 — Normal-range column crashes for sex "other" and mishandles a 0 min `[medium, HIGH]` — ✅ Fixed in #10337
`views/patients/PatientLabTestsTable.jsx:185-189`
`row.normalRanges[patient?.sex]` then `range.min` — the server builds `normal_ranges` with
only `male`/`female` keys, so sex `other` → `undefined` → TypeError (caught per-cell, shows
an error cell on every row). Also `range.min ? …` is truthiness, so a legitimate `min = 0`
range renders as `—`/free-text even though result cells validate against it. The date-cell
accessor at `:217` guards correctly with `!= null`.

### W4 — VaccineForm error gate checks the loading flag, not the error `[high, HIGH]` — ✅ Fixed in #10271
`forms/VaccineForm.jsx:110`
The error branch tests `isLoadingPatientData` instead of `patientDataError` (line 106
already returned a loader when loading). A failed patient-data fetch renders the form with
`patientData === undefined`, which silently disables the "date cannot be prior to date of
birth" validation → a vaccination can be recorded dated before the patient's DOB.

### W5 — lab specimen mandatory-validation bypass on time re-entry `[high, HIGH]` — ✅ Fixed in #10287
`views/labRequest/SampleDetailsField.jsx:194-200`
Clearing "Date & time collected" calls `removeSample(identifier)`, deleting the whole
sample entry (collector, specimen type, site) from the submitted `sampleDetails`, but the
Formik field values and autocomplete display are not cleared. `mandateSpecimenType`
validates the stale Formik value (passes) while the payload has no specimen type → the
mandatory-specimen setting is silently bypassed and the request is created with no
specimen/collector/site.

### W6 — report generator submits stale dependent parameters `[high, HIGH]` — ✅ Fixed in #10286
`views/reports/LabTestTypeField.jsx:21-27` (and `VaccineField.jsx:12-14,54-66` `[medium]`)
Changing the parent parameter (`labTestCategoryId` / vaccine `category`) refetches options
but never clears the previously selected dependent value from Formik. The field displays
empty while the stale JSON is still submitted → a report is generated with contradictory
category + test-type/vaccine parameters.

### W7 — table pagination is uncontrolled and desyncs after any reset `[high, HIGH]` — ✅ Fixed in #10288
`components/Table/Paginator.jsx:170-247`
The MUI `Pagination` is rendered without a `page` prop → uncontrolled. `DataFetchingTable`
resets page to 0 on filter/sort/rows-per-page/refresh changes, but those resets never reach
MUI's internal page state. After a reset, the next/prev chevrons compute from the stale
internal page and jump to the wrong (often empty) page; the page-number buttons are also
computed around the stale page. Fix: pass `page={selectedPageNumber}`.

### W8 — DataFetchingTable has no stale-response guard `[high, MEDIUM]` — ✅ Fixed in #10288
`components/Table/DataFetchingTable.jsx:215-269`
In-flight fetches are never cancelled and responses are applied unconditionally (no sequence
counter / AbortController / match check). The last response to resolve wins and stamps its
own stale page/sort/filter, so typing "smith" then a slow "smi" leaves the table showing
"smi" results — a wrong record set in a clinical list, with no corrective refetch.

### W9 — `TimeWithUnitField` mutates a shared constant → duration defaults to "years" `[medium, HIGH]` — ✅ Fixed in #10342
`components/Field/TimeWithUnitField.jsx:49,58,103`
Two in-place `TIME_UNIT_OPTIONS.sort()` calls mutate the shared `@tamanu/constants` array
(descending in the mount effect, ascending in render), while the default unit is read from
`TIME_UNIT_OPTIONS[0]`. Once a valued instance has mounted, the array is left descending, so
a later-mounted empty instance defaults to **years**. Consumer is `DeathForm`'s "time
between onset and death" fields — entering "30" records 30 years (as minutes) on a death
certificate. Fix: `[...TIME_UNIT_OPTIONS].sort(...)`.

### W10 — LocationBookings initial filter state is a junk object `[medium, HIGH]` — ✅ Fixed in #10338
`contexts/LocationBookings.jsx:28-30`
`useState({ LOCATION_BOOKINGS_EMPTY_FILTER_STATE })` uses shorthand instead of spread →
`{ LOCATION_BOOKINGS_EMPTY_FILTER_STATE: {…} }`, so the intended filter keys are all
`undefined` and a bogus key rides along. For new users (no saved filters) this malformed
object becomes the session filter state and is persisted into user preferences via the
`?clinicianId=` effect.

### W11 — `isLoadingEncounter` sticks true if the encounter fetch fails `[medium, MEDIUM]` — ✅ Fixed in #10339
`contexts/Encounter.jsx:59-87,96-103`
`loadEncounter` sets `isLoadingEncounter(true)` then `await`s `api.get('encounter/:id')`
with no try/finally (only sub-resource fetches are error-wrapped). If the primary fetch
rejects, the flag never clears → the encounter view is stuck on its loading state until a
full reload. Same hole in `createEncounter`.

### W12 — DiagnosisForm offers the triage-only "ED Diagnosis" on regular encounters `[medium, HIGH]` — ✅ Fixed in #10341
`forms/DiagnosisForm.jsx:26-30`
`shouldIncludeCertaintyOption` never excludes `TRIAGE_ONLY` (`EMERGENCY`) when `isTriage`
is false — it falls through to `return !EDIT_ONLY.includes(...)`, which is true for
`EMERGENCY`. "ED Diagnosis" is offered and accepted on ordinary encounters, contradicting
the adjacent comment.

### W13 — report "load failure" message renders as `[object Object]` `[medium, HIGH]` — ✅ Fixed in #10344
`views/reports/ReportGeneratorForm.jsx:222-230`
A `<TranslatedText>` element is interpolated into a template literal, so `requestError`
becomes `"[object Object] - <message>"`. The user never sees the intended explanatory text.

### W14 — DischargeForm sensitive-medication permission dropped for ongoing meds `[medium, HIGH]` — ✅ Fixed in #10343
`forms/DischargeForm.jsx:973-979`
The "Other ongoing medication" table calls `MEDICATION_COLUMNS(...)` omitting the 5th
argument `canWriteSensitiveMedication`, so it's `undefined` in the column accessors →
users who hold the permission still see sensitive-drug quantity/repeats disabled and the
Discontinue action hidden in that table only.

### W15 — DischargeForm unsaved-changes / save-draft flow is dead code `[high, MEDIUM]` — 📋 Filed as [TAM-6969](https://linear.app/bes/issue/TAM-6969)
`forms/DischargeForm.jsx:709` (+`537-539,555-557,640-690,819`)
`setShowWarningScreen` is passed to `DischargeFormScreen` but never called there, and
nothing sets `showWarningScreen` true, so `UnsavedChangesScreen` never renders and
`dischargeDraft` is never written. Cancelling discards all entered discharge data (date,
disposition, medication quantities, notes) with no warning and no draft to restore.

### W16 — ChartForm validates hidden questions `[medium, MEDIUM]` — ✅ Fixed in #10345
`forms/ChartForm.jsx:91`
`validationSchema` is built from `chartSurveyData` (all components) while the screen renders
`visibleComponents` (CURRENT only). A mandatory question retired to historical status stays
`.required()` but isn't rendered → the form can't be submitted and the inline error attaches
to a non-existent field. `VitalsForm` passes the filtered components, confirming the pattern.
Also omits the `{ encounterType }` argument the sibling forms pass.

### W17 — TaskForm keeps a stale frequency when switching templates `[medium, MEDIUM]` — ✅ Fixed in #10348
`forms/TaskForm.jsx:176`
`handleTaskChange` overwrites `frequencyValue` only when the new template has one
(`frequencyValue ? … : null`) and never clears a stale value. Switching from a
frequency template to a once-off template leaves the old `frequencyValue` → the form either
blocks on a required `frequencyUnit` the user never set, or creates a repeating task for a
once-off job.

### W18 — MedicationForm edit swaps a set item's admin times to setting defaults `[medium, MEDIUM]` — 📋 Filed as [TAM-6970](https://linear.app/bes/issue/TAM-6970)
`forms/MedicationForm.jsx:744-755`
In edit mode, `timeSlots` initialises from `defaultTimeSlots` (the
`medications.defaultAdministrationTimes` setting) then spreads `editingMedication` (which
has `idealTimes` but no `timeSlots`). The displayed schedule never reflects the medication's
real `idealTimes`, and on submit `idealTimes` is recomputed from `timeSlots` → the set item's
times are silently replaced with the setting defaults.

### W19 — programRegistry "Related conditions" cell sorts Z→A `[medium, HIGH]` — ✅ Fixed in #10346
`views/programRegistry/ProgramRegistryTable.jsx:24-32`
Comparator is `(a, b) => b.localeCompare(a)` (swapped arguments) → reverse alphabetical,
contradicting the ascending sort of the same data on the detail page; in a line-clamped
cell the wrong conditions get truncated.

### W20 — location-booking clinician prefill compares primary-TZ vs facility-TZ times `[medium, HIGH]` — 📋 Filed as [TAM-6971](https://linear.app/bes/issue/TAM-6971)
`views/scheduling/locationBookings/LocationBookingsDailyCalendar.jsx:561-576`
`getAssignedUserForSlot` parses `assignment.startTime` (stored in the primary timezone) with
raw `parseISO` and compares against facility wall-clock slots. When facility TZ ≠ primary TZ
the overlap is offset → clicking a cell prefills the wrong clinician or none.

### W21 — ProgramsView survey-list fetch has no staleness guard `[medium, MEDIUM]` — 📋 Filed as [TAM-6972](https://linear.app/bes/issue/TAM-6972)
`views/programs/ProgramsView.jsx:92-130`
`selectProgram` awaits `program/:id/surveys` then unconditionally `setSurveys`. Two quick
program changes race; the later-resolving (stale) response wins → the dropdown shows the
wrong program's forms and a survey can be recorded against the wrong program.

### W22 — DateSelector arrow-key handler bound to the whole toolbar `[medium, MEDIUM]` — ✅ Fixed in #10347
`views/scheduling/outpatientBookings/DateSelector.jsx:183-195`
`handleOnKeyDown` is on the outer `Wrapper`, which also contains the editable month input
and buttons. ArrowLeft/Right bubbling from those children mutates the selected date and calls
`previousElementSibling/nextElementSibling.focus()`, which throws when there's no sibling.

### W23 — Translation search builds an unescaped RegExp `[high, HIGH]` — ✅ Fixed in #10280
`views/administration/translation/TranslationForm.jsx:268-271`
The search box builds `new RegExp(...)` from raw user input (only the first `.` is escaped).
An unbalanced `(` or `[` throws `SyntaxError` in `useMemo` during render → the app
ErrorBoundary replaces the whole admin view and unsaved edits are lost; extra dots also act
as wildcards.

### W24 — Add-user modals use v5 `isPending` on react-query v4 `[medium, HIGH]` — ✅ Fixed in #10281
`views/administration/users/profiles/UserProfileModal.jsx:128-133` + `AddUserModal.jsx:80-84`
`isPending` (react-query v5) is `undefined` on the pinned v4, so the submit-in-flight state
is never set: Confirm isn't disabled and double-clicking fires two `createUser` POSTs
(both pass uniqueness validation) → duplicate users. Sibling `UserLeaveSection` uses v4's
`isLoading`, confirming the mismatch.

### W25 — Report editor: other admin/report-editor defects `[medium, MEDIUM]` — 🧹 Techdebt (cooldown board)
`views/administration/reports/EditReportView.jsx:60-72`, `ReportEditor.jsx:44-53`,
`ReportTables.jsx:131-141`, `settings/components/SettingInput.jsx:557`,
`settings/EditorView.jsx:54-70`
A cluster of medium admin bugs: report `name`/random param `id`s leak into stored
`queryOptions`; `Math.random()` React keys drop input focus per keystroke on imported
reports and `values.parameters.map(...) || []` crashes when `parameters` is absent; the
version table's "Created time" column renders `updatedAt`; clearing a numeric setting coerces
to `0` (`Number('') === 0`); and `recursiveJsonParse` converts any string setting whose text
is valid JSON (or the literal `null`) into an object.

---

## packages/mobile

### M1 — survey submit commits partial data on error `[critical, HIGH]` — ✅ Fixed in #10270
`App/models/SurveyResponse.ts:175-275`
The `try/catch` is **inside** `getConnection().transaction(async () => { … })`, so any
mid-submit throw is caught and the callback returns `null` — TypeORM then **commits**
everything written so far (encounter, response row, a subset of answers, vital logs). This
directly defeats the in-code comment "better to fail entirely than save partial data". The
UI treats the `null` return as failure and the clinician resubmits → duplicate/partial
survey responses on device and central. `Referral.submit` also dereferences
`response.encounter` on the `null` return → TypeError.

### M2 — auto-generated MAR `dueAt` stored as UTC ISO-8601 `[high, HIGH]` — ✅ Fixed in #10278
`App/models/MedicationAdministrationRecord.ts:160` (→ `Task.dueTime` at `:214/:228`)
`dueAt: nextDueDate.toISOString()` stores a UTC `2026-07-10T20:00:00.000Z` string, while
every other datetime is local ISO 9075 `yyyy-MM-dd HH:mm:ss` (see line 95, and the server
equivalent). It's both the wrong format and offset-shifted, and it syncs to central. Because
`'T' > ' '` lexicographically, it falls outside that day's MAR chart windows. Fix: store a
local ISO 9075 string like the sibling paths.

### M3 — "current encounter" boundary computed in UTC vs local-time strings `[high, HIGH]` — ✅ Fixed in #10284
`App/models/Encounter.ts:136-150` (+`:271-292`, `Patient.ts:111/130/158/180/192-200`)
`getCurrentEncounterForPatient` computes a 3am boundary, converts to epoch, and compares with
`startDate >= datetime(:date,'unixepoch')` — but SQLite renders `unixepoch` as **UTC** while
`startDate` is a local ISO 9075 string. The boundary is off by the device offset, and between
00:00–03:00 it's in the future so nothing matches. At UTC+12 a morning survey attaches to
yesterday's encounter; at UTC−X every submission creates a new encounter. Also skews the
report/visitor/referral windows.

### M4 — report query filters `deviceId` in `HAVING` on a non-aggregated column `[medium, HIGH]` — ✅ Fixed in #10351
`App/models/Encounter.ts:268-295`
`getTotalEncountersAndResponses` groups by `date(startDate)` then `.having('encounter.deviceId = :deviceId')`.
In SQLite a bare non-aggregated column in `HAVING` takes an arbitrary row's value, so per-day
totals aggregate all devices and each day is kept/dropped by whichever row SQLite picks. The
sibling queries correctly use `.andWhere(...)`.

### M5 — offline login TypeErrors for an unknown email `[medium, HIGH]` — ✅ Fixed in #10349
`App/services/auth/AuthService.ts:80-94`
`localSignIn` dereferences `user.password` before the `!user` check, so an unknown/typo'd
email (`findOne` → null) throws `TypeError` instead of the intended
`AuthenticationError(invalidUserCredentials)`; the `!user ||` guard at line 93 is dead.

### M6 — incoming tombstones store the literal string `datetime('now')` `[medium, HIGH]` — ✅ Fixed in #10350
`App/services/sync/utils/buildFromSyncRecord.ts:15`
`data.deletedAt = record.isDeleted ? "datetime('now')" : null` is bound as a **parameter**,
so SQLite stores the 15-char literal text, not a timestamp. `deletedAt IS NULL` filtering
still works, but the datetime column holds garbage → any parse/compare/display of the
deletion time breaks.

### M7 — `PatientAdditionalData` field ticks never recorded on insert `[medium, MEDIUM]` — ✅ Fixed in #10353
`App/models/PatientAdditionalData.ts:187-192`
The insert branch checks `this[snakeCase(camelCaseKey)]` but entity properties are camelCase,
so it's always `undefined` and no per-field ticks are recorded. A PAD inserted with initial
values syncs up without `updatedAtByField`, so central's field-level merge against a
concurrent edit can lose the mobile-entered values. (The update branch is correct.)

### M8 — hierarchy suggester filter gets raw rows → empty child dropdowns `[medium, MEDIUM]` — 📋 Filed as [TAM-6973](https://linear.app/bes/issue/TAM-6973)
`App/ui/helpers/suggester.ts:165-180` + `App/ui/components/HierarchyFieldItem.tsx:30-36`
`fetchSuggestions` uses `getRawMany()`, so `filter` receives flat raw rows.
`HierarchyFieldItem`'s filter reads `item.parents[0]` (undefined on a raw row) → TypeError
swallowed by the surrounding catch → the cascading child dropdown always shows no options.

### M9 — queued sync never emits `SYNC_ENDED` → `waitForCurrentSyncToEnd()` can hang `[medium, MEDIUM]` — 📋 Filed as [TAM-6974](https://linear.app/bes/issue/TAM-6974)
`App/services/sync/MobileSyncManager.ts:209-221`
`runSync` sets `isSyncing = true`, then on the queued path sets it back to `false`; the
`finally` emits `SYNC_ENDED` only `if (this.isSyncing)`, so on the queue path the event
never fires. A caller already inside `waitForCurrentSyncToEnd()` (e.g. `stopSyncService`)
waits forever. `isQueuing` is also never reset if a later attempt throws.

### M10 — AuthContext permanently suppresses sign-out after one reconnect `[high, HIGH]` — ✅ Fixed in #10279
`App/ui/contexts/AuthContext.tsx:190-199`
The `authError` handler is meant to skip sign-out once during a password reconnect, but sets
`setPreventSignOutOnFailure(true)` again (the comment says "reset flag"); `false` is never
set anywhere. After the reconnect modal is used once, the flag stays true and **every** future
auth error is swallowed → the app stays "signed in" with dead auth and silently failing sync.

### M11 — program-registration "Add additional" inserts `undefined` → crash/duplicates `[high, HIGH]` — ✅ Fixed in #10283
`App/ui/.../patientProgramRegistration/form/PatientProgramRegistrationConditionsField.tsx:329`
+ `PatientProgramRegistrationDetailsForm.tsx:92-102`
"+ Add additional" inserts `undefined` and relies on the modals to replace it; backing out of
the condition modal leaves the `undefined` entry (cleanup is only wired to the category
modal). Yup doesn't reject `undefined` items, so submit saves the registration then throws on
`condition.condition.value` → no navigation, and re-tapping Confirm re-creates the already
saved conditions → duplicate condition records. `onChange` also mutates Formik state directly.

### M12 — patient village mandatory validation never enforced `[medium, HIGH]` — ✅ Fixed in #10352
`App/ui/components/Forms/NewPatientForm/PatientPersonalInfoForm/patientDetailsValidationSchema.tsx:71-78`
The schema uses field key `village` and setting `fields.village.requiredPatientData`, but the
form field/column is `villageId` and the settings schema only defines `fields.villageId`. The
setting lookup returns `undefined`, so village is never enforced even though the UI shows the
required asterisk (it reads the correct `fields.villageId`).

### M13 — registration-date picker blocks all past dates `[medium, HIGH]` — ✅ Fixed in #10356
`App/ui/.../patientProgramRegistration/form/PatientProgramRegistrationDetailsForm.tsx:166-172`
The "Date of registration" `DateField` uses `min={new Date()}`, so only today/future dates
are selectable — backwards for a registration date (elsewhere the equivalent constraint is
`max={new Date()}`; web has no min). Outreach data entry for past registrations is impossible,
and editing an existing past-dated registration can't re-select its original date.

### M14 — `formatPlainTime` renders midday/midnight wrong `[medium, HIGH]` — ✅ Fixed in #10354
`App/ui/helpers/date.ts:72-84` (consumed at `SurveyResponseDetailsScreen/index.tsx:96`)
12-hour conversion uses `hour % 12` with no `|| 12` correction, so `12:30` renders `00:30pm`
and `00:30` renders `00:30am`. A survey Time answer at midday shows "00:30pm" — ambiguous and
clinically misleading on observation/medication times.

---

## Notable non-findings (investigated, deliberately not reported)

- `components/Appointments/DailySchedule.jsx` has a broken datetime comparator but is dead
  code (not imported).
- `permissions/middleware.js` null-action path is unreachable (no caller passes a null action).
- Mobile sync pull/push batching, cursors, and tick choreography were verified correct.
- `refreshChildRecordsForSync` / `bumpSyncTickForRepull` `SET … = 1` is the documented
  re-queue idiom, not a bug.
- Numerous 500-instead-of-404 null-deref cases and cosmetic issues were judged below the
  significance bar.
