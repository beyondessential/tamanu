# Split invoice items into sections by encounter type

The data model is settled — see the tech design. This plan turns it into build steps. Insurance and
the printed invoice are separate cards.

## Invoice table layout

With split encounters the invoice table gains a header row per section and an Add item row per
section, so it needs to stay within the invoice pane at common laptop widths (1440px) rather than
scrolling sideways. The split encounter invoice mockup shows the approach:

- The price breakdown under an item's cost (item discount, price after discount, insurance plan lines) should not widen the Cost column. Its labels extend left under Ordered by, which is empty on those lines. In the mockup this is `contain: inline-size` on the breakdown rows in `PriceCell.jsx`
- Each column's minimum width (`CELL_WIDTHS` in `features/Invoice/constants.js`) gives way when the table is narrower than the minimums add up to. Wide screens keep today's widths. In the mockup the table wrapper is a size container and each minimum is `min(<current em>, <share of the table width>)`
- The invoice card keeps its 750px minimum. Below that the pane still scrolls sideways, as the Patient payments section has fixed-width columns too

## Scope

- The printed invoice is covered by separate work
- Insurance is out of scope entirely: per-section plans, per-section coverage lines and insurer balances all belong to the upcoming insurance card. This card leaves the Insurance plan action, the coverage line and the insurer payments table invoice-wide, exactly as they are today
- What is left here is the sectioned display of items: section headers, per-section Add item, the sectioned Edit invoice window, the per-section date limits, and the setting

## Setting

Sections read the setting at display time, with nothing recorded per invoice about how it was
created, so an invoice sections and unsections without rework. The setting is expected to be
configured once per deployment, so the switch-over case is not designed for.

## Data model

An item's section is stored on the item when it is added, pointing at a new Invoice section
reference data type. It is never derived from the item's date: a date carries no time, a corrected
admission time would re-sort items already placed, and a manual item has no real time to record.

A section's period boundary comes from the changelog, which is the only source carrying the
encounter type and start date together at each revision. `encounter_history` is deprecated, and
its `date` is the time the move was recorded rather than the admission date entered on it.

The changelog is a weaker source than it looks, and the limits below are verified rather than
suspected. It is not written locally when a record arrives by sync: the audit trigger is paused
(`FacilitySyncManager.pullChanges`, `CentralSyncManager.persistIncomingChanges`) and the origin's
own rows are carried across and inserted verbatim. What gets carried is bounded by the sync
window — `getLookupSourceTickRange` selects rows whose tick falls in the range of lookup ticks
being synced, which it describes as the recent entries — and `applyBootstrap` carries none at all.
So a facility holds the full history only for encounters whose moves happened inside a window it
has synced. An encounter that moved before the facility was bootstrapped, or before its patient
came into the facility's sync scope, arrives as a current row with no history behind it.

This is accepted for this card rather than designed around. Recording the boundary ourselves, in a
table that syncs like any other, is the durable answer and is the thing to revisit if sites report
sections going missing.

No deployment has existing invoice data, so nothing is backfilled. An item with no section renders
in an unlabelled section at the foot of the invoice.

## Reference data type

- [x] Add `INVOICE_SECTION: 'invoiceSection'` to `REFERENCE_TYPES` in `packages/constants/src/importable.ts`
- [x] Add `defaultProvisioningData/Invoice Section.json5` with the three default rows, codes `inpatient`, `outpatient` and `emergency` — or list the type in `EXCLUDED_FROM_FULL_IMPORT_CHECK` in `packages/central-server/app/subCommands/provision.js`. Without one of the two, `provision` throws and the deploy's central-provisioner job fails, so central-api never starts
- [x] Add a name pool for the type to `REFERENCE_DATA_NAMES` in `packages/fake-data/src/fake/names.ts`, or seeded rows are named "Invoice Section 42"
- [x] Check the type imports from the reference data spreadsheet and appears in the admin panel's Manage tab

## Schema and migration

- [x] `npm run create-migration -- addInvoiceSectionToInvoiceItems` — `invoice_items.invoice_section_id`, nullable, referencing `reference_data`
- [x] Add `invoiceSectionId` to `InvoiceItem` with a `belongsTo` to `ReferenceData`, and include it in `getListReferenceAssociations` so the section comes back with the item
- [x] Keep DML out of the migration. Nothing is backfilled
- [x] Regenerate `database/model/`, fill the new `TODO`s, run `npm run dbt-check-todos`
- [x] No mobile migration — invoicing has no TypeORM models

## Setting

- [x] Add the split setting under `features.invoicing` in `packages/settings/src/schema/global.ts`, defaulting off and exposed to web
- [x] Reconcile the spec's "Invoice category" with how `features.invoicing` is presented in the admin panel

## Recording the section on an item

- [x] Add a resolver that maps an encounter to its section: `ENCOUNTER_TYPE_PATIENT_STATUSES[encounterType]`, then the `invoiceSection` row with that code. It returns null for an encounter type with no status, and for a missing row, so an unconfigured deployment renders flat rather than erroring
- [x] Set the section in `Invoice.addItemToInvoice` and `Invoice.addEncounterFee` — both already load the encounter, so no date arithmetic is involved
- [x] Set it in `reconcileBedFeeLines` through the same resolver. It only runs for admission encounters, so Inpatient is correct by construction
- [x] Accept `invoiceSectionId` on the items array of `updateInvoiceSchema` in `invoices.js`, **and exclude it from the fields written on conflict**. `PUT /v1/invoice/:id` is the create path for manual items as well as the update path — there is no POST — and the loop calls `InvoiceItem.upsert({ ...itemData, invoiceId })` with every field, so without that the section of an existing item changes whenever a client round-trips it

## The period boundary

Verified, so not worth re-deriving during the build: the changelog does carry a move that
happened within a synced window, because the origin's rows travel with the record. What it does
not carry is a move from before the facility's bootstrap or from before the patient entered its
sync scope. Build so that absence degrades rather than breaks — see the fallback below.

- [x] Read `logs.changes` for the encounter with a single `record_id` equality — no `IN` list, no `record_id::uuid` cast, no `record_data->>` filter. `record_id` carries a hash index on facility servers; anything else is a sequential scan of the largest table in the deployment
- [x] Build periods from the revisions where `encounterType` changed, each starting at that revision's `startDate`
- [x] Name the index in the PR, per `coding-rules.md` — `changes_record_id`, a hash index on `logs.changes.record_id`, named in the PR body and beside the query itself

## Reading and rendering

- [x] One shared period builder in `packages/utils/src/invoice/`, taking the encounter and the changelog revisions, so the invoice view and the Edit invoice window cannot disagree
- [x] Build sections from the encounter and the boundary rather than from the items, so a period with no items still renders with its header and Add item
- [x] Bucket items by their stored section, never by date. Items with no section go last, in an unlabelled section
- [x] **Fallback for a missing boundary:** build the section list from the union of the periods the changelog yields and the sections the items actually carry, so a section with items but no period still renders under its own name. Without this an encounter whose move predates the facility's sync window renders one period from `encounters.start_date` — correct for the current section, since a move to admission rewrites that date — and drops every earlier item into the unlabelled section at the foot. Totals are unaffected either way
- [x] A section with no period shows its name alone, sits after the dated sections and above the unlabelled one, and takes the encounter's own dates as its picker limits
- [x] Section header: configured name, the period's date range, and "Current" for a running period
- [x] Header colour from `PATIENT_STATUS_COLORS` keyed by the section code. The step as written said to re-key that map on the shared `PATIENT_STATUSES`; that turned out to be wrong and the mapping stayed at the call site. The map carries a `Deceased` entry with no equivalent in `PATIENT_STATUSES`, and four of its five consumers read a title-case value straight from encounter data, so re-keying is an invasive change for no behavioural gain. A review round asked for the re-key again and was declined on the same grounds. What the step got right was the fallback: relying on the map's `[undefined]` entry read as an accident at the call site, so it is now a named constant
- [x] Per-section Add item. Invoice-wide actions stay in the single overflow menu; section headers carry no actions
- [x] Apply the table layout notes above so the sectioned table still fits the pane at 1440px — not needed as it turned out. Section headers and per-section Add item rows span the table with `colSpan`, so they add no width, and the per-section insurance buttons that drove the original concern left with insurance. The column minimums are unchanged, totalling 56em against the invoice card's 750px minimum. A visual check at 1440px is still owed and is in the test cases

## Edit invoice and date limits

- [x] Section the Edit invoice window the same way as the invoice, each section opening with its header row
- [x] Pass each section's period into `DateCell.jsx` as min and max — it renders a bare required `DateField` with no limits today, and this is the only thing enforcing the date rule
- [x] A new item in an ended period starts with an empty date; in the current period it starts at today and backdates as far as the section's start
- [x] A date outside the range shows an inline error naming the first and last allowed dates, and blocks the save
- [x] No front-end affordance anywhere for changing an item's section

## Tests

- [x] Endpoint test: an item keeps its section when the invoice is saved again with a different `invoiceSectionId` in the payload
- [x] Endpoint test: auto-added items land in the section for the encounter's category at the time — ED fee in Emergency, bed fees in Inpatient
- [x] Unit test for the period builder: an encounter that never moved, one crossing, the move day falling in both periods, and a still-running period
- [x] Unit test for the fallback: an encounter that moved, with no changelog rows, still renders every section its items carry
- [x] Unit test for the resolver: a never-sectioned encounter type and a missing reference data row both return null
- [x] Web test: the date field for an item in an ended section rejects a date outside that section's period


## Review round 2

Round 1's date fix resolved the section periods, which bound things that had no bounds before, and round 2 was largely that wave arriving. Worth keeping in mind for anything similar: putting a limit where there was none changes who is held to it, not just what the limit is.

- The period is enforced on rows being added or edited, never on an already-saved item sitting outside it. Clamping such an item on save would silently rewrite a billing date nobody touched
- `specs/invoicing/encounter-type-sections.md` contradicted itself on this: one criterion said such an item keeps its date, another said it is brought back inside the period on save. Resolved in favour of keeping the date
- A row with no section falls back to the encounter's own range, so the general invoicing criterion holds on an unsectioned invoice too
- Boundaries are resolved in the facility's timezone, not the primary one the datetimes are stored in, because they are compared against a facility-local today
- A boundary can move but never back past the one before it, so a corrected admission cannot invert a period
- The section is resolved once per request where several items are added together; the changelog read projects the two fields it needs rather than the whole snapshot
- The per-item invoice section include was removed: nothing read it


## Review round 3

The rounds were not converging because the period rules were implemented twice, once in the shared builder and once in the invoice form, so each server-side fix left the client behind. Round 2's timezone fix did exactly that. Consolidating them is what should stop it.

- Period resolution now lives beside the builder in `@tamanu/utils`, and the endpoint sends the encounter's own period, already facility-local, with the sections. The form consumes both and derives nothing
- The picker and the schema read the same period, so they cannot disagree about what is selectable
- A manual item's section is resolved only when one is actually being added; a save that edits existing lines reads neither the configured sections nor the encounter's current one
- The section id is validated as a non-empty string, not a uuid: a provisioned section's id is a code such as `invoiceSection-emergency`
- One finding was wrong and was skipped: it claimed a test's section cleanup would violate the foreign key, but every model is registered paranoid, so the delete is soft


## Review round 4

Round 4 was mostly an audit of round 3's own changes rather than a new wave of behaviour, and six of its findings were things those fixes introduced. Worth remembering: a fix made under review pressure deserves the same care as the original code, particularly around test isolation and honest types.

- Round 3's consolidation gated the encounter's period behind the splitting setting, which defaults to off, so a default deployment lost date validation entirely. The period is a general invoicing rule and is now resolved whatever the setting says; only the sections, and the changelog read behind them, stay behind it
- Three section tests passed only because another test had cleaned up after itself. Each arranges and releases its own state now, in a finally
- The release is a soft delete. A hard one violates the foreign key, which is what a round-3 reviewer predicted for the soft case and was wrong about; trying `force` here proved the mechanism while confirming the original code was right
- Whether an invoice counts as split, and how a section's period renders, each had one definition and now keep it
- The migration's down carries its DESTRUCTIVE marker, and the changelog query names `changes_record_id` rather than asserting an index exists


## Review round 5

Six findings, down from sixteen, and only one a defect: the consolidation is holding.

- The existing-items lookup matched on id alone while the destroy beside it scopes by invoice, so an id from another invoice read as existing and the upsert, which writes by id, moved that invoice's line onto this one. The lookup carries the invoice now and a foreign id is refused
- Imaging sectioning, the route's timezone plumbing and the two routes' permission checks are covered. Each was checked by breaking the thing it covers and watching it fail
- An imaging request's status is pinned in its test: only some statuses are invoiceable and fake picks at random, which made the first attempt pass two runs in three
- The write route is declared with a trailing slash, so a request without one is redirected and an assertion on the response reads the redirect rather than the refusal


## Review round 6, and stopping the loop

Four findings, none a defect: two test-hygiene items and the same E2E gap. Across six rounds the counts ran 15, 16, 14, 16, 6, 4, and the last round found nothing wrong with the product. The loop has converged and further rounds would return diminishing nits, so no seventh was requested.

- Tests that arrange reference data release it in a finally, consistently now rather than only where round 4 happened to touch
- An item whose section is hidden after it was charged keeps that section while dropping out of the headings, covered at the endpoint

What is left needs a person, not another round:
- E2E coverage, flagged in every single round and recorded as needing a card eight times over. It is the one place the whole chain is proven in a real stack, and the display failures it would catch are exactly what the unit and endpoint tests cannot
- Enforcing an item's date against its section server-side, recorded as needing a card: it would put a changelog read on every invoice save
- 34 unticked test cases needing manual verification, including the sectioned table at 1440px, which has never been looked at
