### Changes

Adds a skill that drafts, updates and publishes Tamanu user configuration guides, and establishes the
GitHub home for the System Administration documentation currently in Slab.

The skill authors the code-derived parts of a guide (reference data columns, settings, permissions)
from the codebase rather than from existing prose, so a guide matches what the software actually does.
It confirms scope with the author before writing, since module boundaries aren't encoded anywhere in
the code, and lands changes as a reviewed PR.

**Structure**

`docs/user-manuals/system-administration/` holds one folder per Tamanu module, 24 in workflow order
from Deploying Tamanu through to Integrations. Each module's configuration is documented in three
guides by surface — reference data, settings, permissions — numbered within the module, so Medications
is 15 and its settings guide is 15.2. Numbers live in content rather than paths, so reordering never
breaks a link.

**What's here**

| Path | What it is |
| --- | --- |
| `.agents/skills/draft-config-guide/` | The skill. Procedure only; cites the docs below rather than restating them |
| `.agents/docs/config-guide-format.md` | The format standard: structure, settings blocks, tables, callouts, version flagging, screenshots, and how guides render on GitHub vs the docs site |
| `docs/user-manuals/system-administration/` | The tree: section README, 23 module folders, and the Medications guides |
| `.workhorse/` | Card artefacts: working doc, plan, test cases, three mockups |

No product code is touched, and there are no config or settings changes.

**Worth knowing when reviewing**

- **The migration corrected real drift.** Authoring against code surfaced errors in the published
  guide: the unit list was missing 24 of 56 units, `Medication Set`'s `type` was documented as
  `MedicationSet` when the importer expects `medicationSet` (following the guide literally would fail
  the import), the permission subject is `Setting` not `Settings` (a role configured against the wrong
  subject grants nothing and errors nowhere), and `availableFacilities` needs a JSON array. Full list
  in `.workhorse/plans/k8/plan.md`.
- **1 of 24 modules is written.** The other 23 folders carry a README describing the module and stating
  no guide exists yet, so the migration backlog is visible rather than implied.
- **Medications points at Dispensing guides that do not exist yet**, in two places. Dispensing is its own
  module (16) and owns the pharmacy order settings, the `MedicationDispense` and `MedicationRequest`
  permissions, and two reference data types. Its scope is recorded in the plan for when it is written.
- **The guides carry 11 screenshot placeholders**, each naming the image file it awaits. Screenshots
  are captured by a Playwright spec reusing the page objects in `packages/e2e-tests/pages/`; that spec
  isn't written yet, so it's the first follow-up. 9 of the 11 are in the settings guide.
- **Test cases are unticked on purpose.** They specify the coverage the skill owes; the first real run
  exercises them.

### Auto-Deploy

- [ ] **Deploy** <!-- #deploy -->

### Tests

- [ ] **Run E2E tests** <!-- #e2e -->
- [ ] **Run DAST scan** <!-- #dast -->

### Review Hero

- [x] **Run Review Hero** <!-- #ai-review -->
- [ ] **Auto-fix review suggestions** <!-- #auto-fix -->
- [ ] **Auto-fix CI failures** <!-- #auto-fix-ci -->
- [ ] **Auto-merge upstream** <!-- #auto-merge -->
- [ ] **Save suppressions** <!-- #save-suppressions -->
