# Config guide skill — technical design

Notes on how the config-guide authoring skill mines Tamanu's configuration surface out of the
codebase, and how it scopes that search to a single module. Behaviour is specified in the card's
working doc (`.workhorse/working-docs/k8/working-doc.md`).

## Where the standard lives

The durable standard for what a configuration guide is, where guides live and how they are authored is
`.agents/docs/config-guide-format.md`, a reference doc the skill cites. It carries no
`workhorse-version` frontmatter, since that marks Workhorse-shipped docs that get smart-merged on
release, and this one is workspace-defined.

This keeps the material out of the specs tree, which here documents Tamanu product behaviour only. A
docs-authoring skill is tooling, not product behaviour, and `.agents/docs/` is already where
agent-facing format guidance lives alongside `spec-format.md`. The card therefore produces no spec
changes.

Division of labour between the three documentation-guidance files:

- `llm/project-rules/write-config-guides.md` — authoring **principles** (audience, verify from code, no
  repetition, Australian English). Unchanged by this card
- `.agents/docs/config-guide-format.md` — the **format**: location, section backbone, content sources,
  version flagging, update and publishing rules
- The skill's `SKILL.md` — the **procedure** for a run. Cites both rather than restating them

## Follow-up: the orphan invoicing guide

`specs/invoicing/configuration-guide.md` is an actual configuration guide sitting in the specs tree. It
is the only file under `specs/` with no frontmatter, and it follows the numbered config-guide house
style rather than the spec format. It belongs in
`docs/user-manuals/system-administration/invoicing/` under the convention this card establishes.

Deliberately out of scope for this card. It makes an obvious early target once the skill exists, and a
good real-world exercise of update mode against a guide nobody generated.

## Sources of truth in code

The guide's three code-derived sections each have a clean, machine-readable home. This is better than
assumed at interview — the skill reads registries, not scattered call sites.

**Settings** — `packages/settings/src/schema/{global,central,facility}.ts`. Each leaf carries
`description`, `defaultValue`, `type`, and flags (`exposedToWeb`, `secret`, `highRisk`, `deprecated`,
`unit`). Scope is implied by the file, and category/sub-category by the key path — which is exactly
the **Scope / Category / Sub-category / Setting** block the guide format needs. Definitions for
complex leaves live in `schema/definitions/` (e.g. `medicationFrequencySchema.ts`).

**Permissions** — `packages/constants/src/permissions.ts` holds a flat subject → allowed-verbs map
(`Medication: [List, Read, Write, Create]`). This gives the `` `verb` for `Subject` `` pairs directly.
What it does *not* give is the "what it unlocks" bullet list under each verb — that has to be inferred
from where the permission is enforced (`req.ability.can()` call sites), or supplied by the author.

**Reference data** — `packages/constants/src/importable.ts` (`REFERENCE_TYPES` /
`OTHER_REFERENCE_TYPES`) enumerates the types and their tab names. The **columns** for a type come
from three places that agree with the published guide:

- `packages/central-server/app/admin/exporter/modelExporters/` — e.g. `DrugExporter.js` maps exactly
  the guide's columns (`route`, `dosingUnit`, `dispensingUnit`, `unitConversion`, `notes`,
  `isSensitive`, plus per-`facilityId` stock columns). The exporter defines the real spreadsheet shape.
- `packages/central-server/app/admin/importSchemas/` and `referenceDataImporter/loaders.js` —
  required vs optional, types, and validation.
- `packages/central-server/app/subCommands/defaultProvisioningData/*.json5` — e.g. `Drugs.json5`,
  `Medication Template.json5`. Real example rows, usable to generate the inline example tables.

Hard-coded enumerations (units, routes, frequencies) come from `packages/constants/` — the same lists
the guide currently mirrors into a Google Sheet.

## The module-scoping problem

No registry groups configuration by "module", and the mapping is genuinely many-to-many. Evidence from
the Medications module:

- **Settings span multiple top-level keys.** `global.ts` has both `medications` *and* a separate
  `medicationAdministrationRecord`; `facility.ts` has its own `medications` subtree; `central.ts`
  carries medication mentions too. Plus feature flags under `features`. A single key lookup misses
  most of it.
- **Prefix matching fails both ways.** `SensitiveMedication` is a medications subject but sorts away
  from `Medication*`; conversely a `Medication*` prefix scan pulls in `MedicationDispense` and
  `MedicationRequest`, which the published guide deliberately does not document.
- **Reference data is shared.** `Drug` belongs to Medications *and* Vaccines (vaccines must appear in
  the Drugs sheet) *and* Invoicing (`INVOICE_ITEMS_CATEGORIES.DRUG`). One type, three guides.
- **Adjacent modules are load-bearing.** The Medications guide documents Tasking permissions and
  settings because the medication-due task depends on them.

So the boundary of "a module's configuration" is an editorial judgment, not a code fact. The skill can
*discover candidates* mechanically but cannot *settle scope* mechanically.

## Decision: discover and confirm, each run

The skill scans the registries for candidate configuration, then **presents the proposed scope for the
author to approve or trim before authoring** — the settings paths, permission subjects and
reference-data types it intends to document. Nothing is stored between runs; there is no manifest to
maintain and no cached scope to go stale.

The reasoning: a manifest would need updating every time a setting moves or a subject is added, and a
stale manifest silently produces a wrong guide. Re-discovering each run means the skill is always
reading current code, and the confirmation step is where editorial judgment (which the code cannot
supply) enters. It also makes the shared-type problem tractable — the author decides whether `Drug`
belongs in this run's guide.

Cost accepted: scope confirmation is a required interaction, so the skill is not fully autonomous. That
suits a documentation skill whose output is published under the project's name.

## Decision: report gaps, never widen scope

When the skill finds configuration a guide omits, it **reports the omission for the author to decide
on and does not add it**. An omission may be deliberate (a subject that exists in code but isn't
supported for deployments yet, like `MedicationRequest`), and silently documenting it would publish
guidance for something unsupported. Reporting keeps drift visible without the skill making a product
call.

## Decision: update mode proposes a diff, never edits in place

A published guide is a mixed document — code-derived tables and settings blocks interleaved with
author-written narrative, clinical caveats and screenshot placeholders. On update the skill
**presents the changes it wants to make for the author to accept, rather than editing the file in
place**. Human-written content cannot be lost silently, and the author sees exactly which facts moved.

This also fits the failure mode that matters: the risk isn't the skill missing an update, it's the
skill quietly overwriting prose that someone wrote deliberately. A proposed diff makes every
substitution reviewable, and means no marker syntax has to be maintained in the published markdown.

## Decision: permission bullets inferred, then confirmed

For each `` `verb` for `Subject` `` pair the skill traces where the permission is enforced
(`req.ability.can()` call sites) and describes in plain language what those paths do, then
**presents each bullet list for the author to confirm or correct**. Same posture as version flags:
the skill does the legwork, the author owns the claim.

Inference alone isn't trustworthy here — a call site tells you a permission guards an endpoint, not
what the user-facing capability is called ("pause and resume a medication"), and the guide's value is
precisely that translation. Confirmation is where that lands.

## Resulting run shape

1. Take the target module/topic as input (decided per run, not from a stored list).
2. Discover candidates from the registries: settings leaves, permission subjects, reference-data types
   and their exporter/importer columns.
3. **Confirm scope** with the author — approve or trim the candidate list.
4. Gather what code can't supply: narrative framing, clinical caveats, scope exclusions.
5. Derive permission bullets and version flags from code; **present for confirmation**.
6. Author the guide in the canonical section order, inline column tables, external template links
   retained, screenshot placeholders marked.
7. Update the module README and the `system-administration/` README.
8. Draft mode: write new file. Update mode: **propose a diff**.
9. Open a reviewed PR (`chore`, repo template, card ticket), reporting any config gaps found.

### Batch the confirmations

Three decisions above each introduce an author checkpoint — scope, permission bullets, version flags.
Run separately these would make the skill an interrogation. They should be **collected into as few
confirmation passes as possible**: settle scope first (it determines everything downstream), then
present the derived permission bullets and version flags together as one review. Worth treating as a
design constraint on the skill body, not an afterthought — a documentation skill that asks twelve
questions won't get used.

## Notable consequence: the skill finds more than the guides document

`permissions.ts` lists `MedicationDispense` and `MedicationRequest`; the published guide covers
neither. Whether that is an intentional omission or documentation drift is unknowable from code. This
makes gap-reporting a real feature of the skill rather than an edge case, and it means the skill must
not silently expand a guide's scope.
