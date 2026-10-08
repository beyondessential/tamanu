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

Each module has three guides — `1-reference-data.md`, `2-settings.md`, `3-permissions.md` — plus a
README. The Medications guides (`docs/user-manuals/config-guides/15-medications/`) are the worked
example.

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

Five things need the author: scope, the capabilities listed under each permission (inferred from
`req.ability.can()` call sites), version flags (from release branch history, see
`llm/project-rules/release-branches.md`), the example template link for each reference data type, and
which action buttons each screenshot outlines in red.

Settle **scope first**, then present the drafted permission capabilities, version flags, lead
paragraph and proposed red outlines, and ask for the template links, **together as one review**. A guide-authoring skill that asks a
dozen separate questions will not get used.

### 4. Screenshots

Leave a placeholder for each image the guide needs, per the format doc. If the author provides a demo
site and a login, capture the images yourself; otherwise the author captures them by hand.

To capture from a demo site:

- **Confirm first** that the site holds synthetic data only, since the images are published; that it
  runs the version the guide documents; and which address serves the admin panel, since settings
  screens are there rather than on the facility frontend
- **Keep the login to the session.** Never write it to a file, commit it, or put it in the PR. If a
  login fails, stop and check rather than retrying: repeated failures can lock a shared account
- **Browse, do not change.** Never save a setting, and close forms without submitting them. Get the
  author's go-ahead before typing invalid input for an error-state image, or creating records a
  screen needs; without it, leave that placeholder
- **Use only the test patient the author names.** Where that patient's records cannot show a screen,
  leave the placeholder rather than using another patient
- **Use a throwaway headless-browser script outside the repository**, not a spec in the e2e suite
- **Capture per the format doc**: cropped to the part of the screen the section is about, at twice
  screen resolution, with the red outlines the author chose drawn in at capture and a black border
  drawn around the image
- **Check each image before using it**: it shows what its placeholder describes, and no real names.
  Save it to the `images/` folder named for its guide and what it shows, replace the placeholder, and
  add its centred caption

### 5. Report gaps, never widen scope

You will find configuration a guide does not document. Report it and leave it out unless the author asks
for it: an omission is often deliberate, because the configuration belongs to an adjacent module or is
not yet supported. Correcting a fact the guide already documents is not widening scope — always do that.

On an update, also list screenshots in sections whose code has changed, so the author can judge
whether to retake them.

### 6. Land it

Write the guides, update the module README and the section README, and commit. The author reviews the
diff and raises the pull request, so name the card to Tamanu's conventional commit format
(`llm/project-rules/pull-requests.md`; `docs` is not an allowed type, use `chore`) rather than opening
one yourself.

Then tell the author what you wrote, the configuration gaps you found, and any screenshot placeholders
still to be filled and why, so that goes in the pull request.
