# One lab request per category

Working notes for folding panels into a per-category lab request. Nothing here is
committed to a spec yet; the interview that produced these notes was cut short.

## Where the current behaviour lives

- `packages/facility-server/app/routes/apiv1/labs.js` — `createPanelLabRequests`
  (one request per panel) and `createIndividualLabRequests` (one request per
  category). The `POST /labRequest` handler picks between them on whether
  `panelIds` is present.
- `packages/database/src/models/LabRequest/LabRequest.ts` — the single
  `labTestPanelRequestId` link, and `createWithTests`.
- `packages/database/src/models/LabRequest/hooks.ts` and
  `packages/database/src/models/LabTest/hooks.ts` — invoicing. Both reach the
  panel through the request's single link, and treat panel billing and
  individual-test billing as mutually exclusive.
- `packages/facility-server/app/routes/apiv1/labs.js:449` — the panel-ordered
  test list, which orders by the panel's reference-data ordering only when the
  request has a panel.
- `packages/database/src/utils/fhir/ServiceRequest/getValues.ts` — `labCode`
  maps the request's one panel to the ServiceRequest `code`; individual tests go
  to `orderDetail`.

## Decisions taken

**Each lab test carries its own panel attribution.** Today the request *is* the
panel, so every test on it belongs to that panel implicitly. Once one request
holds several panels plus loose individual tests, that no longer identifies
anything, and the lab request view (card D4) needs panels listed first with their
own tests. A panel link on the test also simplifies the `LabTest` invoicing hook,
which currently reaches up to the request to find the panel.

Reflex tests added by SENAITE arrive with no panel attribution, which places them
in the individual-tests section — matching what the PRD asks for.

**A test type appearing in two panels of the same request gets a row per panel,**
with the copies kept in step rather than deduplicated at creation.

## Open questions

**Historical requests, given no backfill.** The refinement note rules out
backfilling. Existing panel requests' tests would then have no panel attribution
and would render as individual tests, so historical requests look wrong under the
new display. A real backfill is unattractive: a bulk `UPDATE` on `lab_tests`
re-stamps the sync tick on every touched row and triggers FHIR rematerialisation,
on one of the largest tables.

Proposed cheap alternative, not yet accepted: if the panel request links to its
lab request, then a request holding exactly one panel whose tests carry no panel
attribution can be read as "all these tests belong to that panel". Every
historical request is single-panel by construction, so this covers them with no
migration.

**The fan-out rule for shared test types.** SENAITE returns one result for a test
type. Proposed rule, not yet confirmed: a result for a test type applies to every
row of that type within the request, covering both SENAITE ingestion and manual
entry. Without it a lab officer enters the test twice in the results modal and
the two can disagree. Note this reaches into results entry, so it may push the
card past its stated backend-only scope.

**Double billing on shared test types.** Where a shared test type has a
lab-test-type invoice product and neither panel has a panel product, today's
fallback bills each test row, so two rows would bill twice. Needs a rule on
whether billing deduplicates by test type within a request.

**Carried from the card description, still unresolved.**

- Whether a lab test panel's category is mandatory (mirroring lab test types) or
  stays optional with a defined fallback. Grouping a panel under its own category
  needs this. @MeganLane29 following up.
- If mandatory, whether the validation, admin-panel and reference-data-import
  work lands here or in a separate reference-data card this one depends on.
- Whether SENAITE can return the same result to two panels sharing a test, and
  how it shows once rather than twice in the patient results table. For Rohan.
