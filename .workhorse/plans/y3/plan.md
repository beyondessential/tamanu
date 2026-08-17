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

**A result for a test type applies to every row of that type in the request.**
SENAITE returns one result per test type, and a lab officer entering results
manually should not have to fill the same test twice and risk the two
disagreeing. This reaches into results entry, so it pushes the card past its
stated backend-only scope.

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

**FHIR carries panels in `orderDetail`, leaving `code` empty.** Panel codings use
the lab panel code system and test codings the lab test code system, so the two
stay distinguishable within the one array.

The single-sample requirement falls out of the merge itself: `FhirSpecimen` is
materialised one per lab request (`Specimen/getValues.ts`), so merging the
requests merges the samples with no further mapping work.

**Panel category is mandatory**, mirroring lab test types. The pattern to follow
is `LabTestType.mustHaveCategory` (`LabTestType.ts:102`) — a model-level
validator that exempts soft-deleted rows, not a `NOT NULL` column. That keeps the
change small and avoids a destructive migration, and reference-data import picks
the rule up for free by going through the model.

**Existing panels with no category** can be derived rather than guessed. The
refinement note assumes every test in a panel shares a category, so a panel's
category is its test types' category. Unlike the `lab_tests` backfill this one is
cheap: `lab_test_panels` is small reference data.

## Open questions

**Does SENAITE read panel codes from `orderDetail`?** Moving panels out of `code`
changes the outbound contract. Nothing inside Tamanu reads `orderDetail`, so this
is entirely a question about what SENAITE accepts, and it needs confirming before
the change ships. For Rohan, alongside the shared-result question below.

**A panel whose tests are all unavailable at the requesting facility.** Test types
are filtered by `availableFacilities` at creation. Today a panel with no
surviving tests fails the whole submission, because `createWithTests` rejects an
empty test list. Once a request holds several panels, one panel can be emptied
while others survive — so the request should presumably be created without that
panel rather than rejected, but that is a behaviour change nobody has asked for
yet.

**Panels that resist the category derivation.** A panel with no test types, or
one whose test types span categories in breach of the refinement assumption, has
nothing to derive from. Needs a rule before the migration can be written.

**Does the panel-category enforcement land in this card?** Validator, admin panel
and reference-data import. The validator is small, but the admin-panel and import
surfaces may argue for a separate reference-data card this one depends on.

**Does SENAITE read panel codes from `orderDetail`?** Moving panels out of `code`
changes the outbound contract. Nothing inside Tamanu reads `orderDetail`, so this
is entirely a question about what SENAITE accepts, and it needs confirming before
the change ships. For Rohan.

**Can SENAITE return the same result to two panels sharing a test,** and how does
it show once rather than twice in the patient results table. Also for Rohan.

**A panel whose tests are all unavailable at the requesting facility.** Test types
are filtered by `availableFacilities` at creation. Today a panel with no
surviving tests fails the whole submission, because `createWithTests` rejects an
empty test list. Once a request holds several panels, one panel can be emptied
while others survive — so the request should presumably be created without that
panel rather than rejected, but that is a behaviour change nobody has asked for
yet.
