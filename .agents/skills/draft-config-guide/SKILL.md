---
name: draft-config-guide
description: >-
  Draft, update and publish a Tamanu user configuration guide for a module, covering its reference
  data, settings and permissions. Use when the user wants a configuration guide written or refreshed
  for a module (e.g. "write a config guide for Vaccines", "update the Medications config guide"), or
  wants existing System Administration documentation brought into GitHub. Authors from the codebase so
  the guide matches what the software does, and lands it as a reviewed pull request under
  docs/user-manuals/config-guides/. Not for developer documentation or release notes (use
  draft-release-notes for the latter).
label: "Draft config guide"
---

## Your task: Draft a configuration guide

You write the configuration guides a system administrator or project manager configures a deployment
from. You author them **from the codebase**, so what they describe matches what the software does, and
land them as a **reviewed pull request**.

Read `.agents/docs/config-guide-format.md` first and follow it for anything about what a guide looks
like: structure, tables, settings blocks, callouts, version flags, screenshots, and the accuracy rules.
This file is the procedure only.

Each module has three guides — `reference-data.md`, `settings.md`, `permissions.md` — plus a README.
The Medications guides (`docs/user-manuals/config-guides/medications/`) are the worked example.

Drafting a new guide and updating an existing one are the same job from different starting points. When
updating, read the existing guides first: they carry author-written content you must preserve.

### 1. Establish scope, and confirm it

A module's configuration is not grouped anywhere in the codebase, and the boundary between modules is
editorial. Medication settings span several schema keys; `Drug` reference data belongs to Medications,
Dispensing and Immunisations at once.

Discover candidates:

- **Settings** — `packages/settings/src/schema/{global,central,facility}.ts`. Search beyond the
  obviously-named subtree; related settings hide under other top-level keys and under `features`
- **Permissions** — `packages/constants/src/permissions.ts`. Search by meaning, not prefix: a subject
  like `SensitiveMedication` sorts away from its siblings
- **Reference data** — `packages/constants/src/importable.ts` for the types, then the importers
  (`packages/central-server/app/admin/referenceDataImporter/`), import schemas and exporters
  (`.../admin/exporter/modelExporters/`) for tab names, columns, required fields and default-when-empty
  behaviour. `defaultProvisioningData/*.json5` has realistic example rows

Then **present the candidate list for the author to approve or trim before writing anything**. Do not
derive scope and proceed.

### 2. Draft what the code cannot give you

Scope limitations, clinical caveats and the lead paragraph are not in the codebase. Draft them from
the module's existing documentation and what you can see of its behaviour, then have the author correct
them. Never invent clinical guidance: where you have nothing to go on, leave a marked gap.

### 3. Batch the author's checkpoints

Three things need the author: scope, the capabilities listed under each permission (inferred from
`req.ability.can()` call sites), and version flags (from release branch history, see
`llm/project-rules/release-branches.md`).

Settle **scope first**, then present the drafted permission capabilities, version flags and lead
paragraph **together as one review**. A guide-authoring skill that asks a dozen separate questions will
not get used.

### 4. Screenshots

Screenshots come from a running Tamanu instance, so you write a capture spec rather than capturing
them. Leave a placeholder for each image per the format doc, then write a Playwright spec at
`packages/e2e-tests/tests/docs/{module}-guide-screenshots.spec.ts` that reaches each screen and writes
the image into the guide's `images/` folder under the name its placeholder gives.

**Reuse the existing page objects** in `packages/e2e-tests/pages/` rather than writing fresh selectors.
Keep the spec out of the normal test run — it captures, it does not assert, so a missing screenshot must
not fail the suite. Use synthetic data only; these images are published. Follow
`llm/project-rules/playwright-e2e.md`.

Three things make a capture spec more than navigation, so plan for them:

- **Most screens need data seeded first.** A screenshot of a medication administration record needs a
  patient, an encounter and a prescription to exist. Create them through the API helpers in
  `utils/apiHelpers.ts` and the fixtures in `fixtures/`, as the feature specs do, rather than trying to
  find a suitable record
- **Settings screens are the cheap majority and map straight onto the guide.**
  `pages/facilityAdmin/SettingsPage.ts` exposes `selectScope`, `selectCategory` and `selectSubCategory`,
  which are the same three fields as the settings block, so each settings screenshot is a direct
  translation of its block. Note the admin panel is a different frontend origin; the shared auth setup
  covers both
- **Some screens have no page object.** Check before promising one: at the time of writing nothing in
  `pages/` covers the medication administration record. Where a screen is uncovered, say so and agree
  with the author whether to add a page object or skip that image. Do not quietly write raw selectors
  into the capture spec, which puts unmaintained locators outside the page-object layer

An error-state screenshot needs input that deliberately fails validation, so it is written like a test
even though it asserts nothing.

Capturing needs a local stack, so tell the author what to run.

### 5. Report gaps, never widen scope

You will find configuration a guide does not document. Report it and leave it out unless the author asks
for it: an omission is often deliberate, because the configuration belongs to an adjacent module or is
not yet supported. Correcting a fact the guide already documents is not widening scope — always do that.

On an update, also report screenshots sitting in sections whose code has changed, so the author can
judge whether to recapture.

### 6. Land it

**Updating proposes a diff**: present changes for the author to accept rather than editing a guide
directly. The risk worth designing against is not missing an update, it is silently overwriting prose
someone wrote deliberately.

Update the module README and the section README, then open a **pull request for review**. Title it to
Tamanu's conventional commit format (`llm/project-rules/pull-requests.md`; `docs` is not an allowed
type, use `chore`) with the repository template. In the PR, summarise what you wrote, report the
configuration gaps you found, and name the capture spec to run where placeholders are outstanding.
