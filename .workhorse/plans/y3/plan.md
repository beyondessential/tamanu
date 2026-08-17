# One lab request per category

Working notes for folding panels into a per-category lab request. The settled
behaviour is written up in `specs/labs/requests.md`; this file keeps the
reasoning behind those decisions and the questions still outstanding.

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

**A result for a test type applies to every row of that type in the request** —
split out to card X5, "Handle shared test results from SENAITE". It reaches into
results ingestion and the results modal, which would push this card past its
backend-only scope, so it is deliberately not delivered here.

**The link is to the panel request, not the panel.** The `LabTestPanelRequest`
is the per-request instance of the panel and is already the invoicing source
record, so attributing a test to it keeps the request's panel set and the tests'
attribution consistent by foreign key rather than by invariant. Linking straight
to `LabTestPanel` would leave "test points at a panel the request doesn't hold"
representable.

This makes the request's panel set derivable from its tests, but the panel
requests are still kept as records: a panel whose tests are all filtered out by
`availableFacilities` still has to exist for invoicing.

**A test type appearing in two panels of the same request gets a row per panel,**
with the copies kept in step rather than deduplicated at creation. Deduplicating
would lose the fact that two panels were ordered.

**Historical requests are read by inference, not backfilled.** A request holding
exactly one panel whose tests carry no attribution is read as "all these tests
belong to that panel". Every historical request is single-panel by construction,
so this covers them with no migration. The alternative was a bulk `UPDATE` on
`lab_tests`, which re-stamps the sync tick on every touched row and triggers FHIR
rematerialisation on one of the largest tables.

Note this is distinct from the schema migration, which does relocate the existing
request-to-panel links into the new one-to-many structure. That is moving data
that already exists, not a backfill.

**Billing deduplicates by test type within a request.** One thing is run, so one
thing is charged — the same logic as propagating a single result to every row of
that type. Panel-level products still bill per panel request.

**The single-sample requirement falls out of the merge itself.** `FhirSpecimen` is
materialised one per lab request (`Specimen/getValues.ts`), so merging the
requests merges the samples with no further mapping work. Where the panel codings
go is still open — see below.

**Panel category stays optional on the model, and is required at import.** The
import half already ships: `baseSchemas.js:193` has carried
`categoryId: yup.string().required()` on `LabTestPanel` since June 2023
(`NASS-790`, 7ecd68a094). No model-level validator and no backfill, so existing
category-less panels are left alone.

**The importer also rejects a panel whose test types span categories,** turning
the refinement note's assumption into an enforced rule. This is new work. Note
there is no admin front-end form for lab test panels — they are created only
through the reference-data spreadsheet importer (`labTestPanelLoader`,
`loaders.js:309`), so the import schema is the only authoring surface there is to
enforce on.

A panel is reference data, not an order, so a category-less panel keeps producing
new orders until its deployment re-imports its panel sheet. The population is
bounded to panels imported before mid-2023 and never re-imported since — small
and shrinking, but not provably empty, which is what the order-time fallback
below is for.

**A category-less panel groups under the category its test types share.** Derived
at order time, so nothing is written. Where the test types do not agree on a
category, the panel forms its own request as it does today.

**A panel with no test types available at the requesting facility rejects the
whole submission,** preserving today's behaviour. Test types are filtered by
`availableFacilities` at creation, and `createWithTests` already rejects an empty
test list — merging does not soften that.

## Open questions

**Where do the panel codings go on the FHIR `ServiceRequest`?** Today `code`
(0..1) carries the one panel, `orderDetail` (0..*) the individual tests, and
`category` a fixed SNOMED `108252007`. With several panels there is no single
`code`. Options considered:

- **a.** Panels join `orderDetail`, `code` left empty. No data loss, and the two
  kinds stay distinguishable by code system, but `code` is the field a consumer
  reads first and nulling it degrades the resource for every consumer.
- **b.** All panel codings inside one `code` CodeableConcept. Ruled out: FHIR
  reserves multiple codings for one concept across systems, so a conformant
  consumer may pick any single coding and silently drop the rest.
- **c.** `code` becomes the lab test category, panels and tests both go to
  `orderDetail`. The request now is a category's worth of work, so this keeps
  `code` meaningful and populated.
- **d.** Keep one ServiceRequest per panel, sharing one Specimen. `Specimen.request`
  is an array, so this is legal FHIR and preserves the SENAITE contract exactly.
  Costly: materialisation keys one resource per upstream record
  (`FhirServiceRequest.upstreamId` is the lab request id, looked up with
  `findOne`), so this changes how materialisation works, not just what it emits.

The choice turns on whether SENAITE's model is one order per profile or one order
per sample — if the former, (d) needs no SENAITE change at all. Ranked (c) > (d) >
(a) pending Rohan's answer, which could invert (c) and (d).

