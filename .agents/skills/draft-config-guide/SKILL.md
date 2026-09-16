---
name: draft-config-guide
description: >-
  Draft, update and publish a Tamanu user configuration guide for a module, covering its reference
  data, settings and permissions. Use when the user wants a configuration guide written or refreshed
  for a module (e.g. "write a config guide for Vaccines", "update the Medications config guide"), or
  wants existing System Administration documentation brought into GitHub. Authors from the codebase so
  the guide matches what the software does, and lands it as a reviewed pull request under
  docs/user-manuals/system-administration/. Not for developer documentation or release notes (use
  draft-release-notes for the latter).
label: "Draft config guide"
---

## Your task: Draft a configuration guide

You write the user configuration guide for a Tamanu module: the document a system administrator or
project manager configures a deployment from. You author it **from the codebase**, so the reference
data columns, settings and permissions it describes match what the software actually does, and you
land it as a **reviewed pull request** rather than a silent edit.

Read these two first, and follow them rather than reinventing their content:

- `.agents/docs/config-guide-format.md` — the format: where guides live, the section backbone, settings
  blocks, tables, callouts, version flagging, and the publishing rules
- `llm/project-rules/write-config-guides.md` — the authoring principles: audience, verifying everything
  against code, no repetition, and not telling project managers how to do their job

The Medications guide (`docs/user-manuals/system-administration/medications/configuration-guide.md`)
is the reference example of the shape you are aiming for.

Guides are markdown, and render differently on GitHub than on the docs site. Never rely on styling to
carry meaning, and do not hand-write HTML to recover a design GitHub will strip. See "How guides
render" in the format doc.

### Draft or update

**Drafting a new guide** for a module, and **updating an existing one** against current code, are the
same job with a different starting point. When updating, read the existing guide first: it carries
author-written content you must preserve, and its scope tells you what the guide is understood to
cover.

### Establish scope before you write

A module's configuration is not grouped anywhere in the codebase, and the boundary between modules is
an editorial judgment the code cannot supply. Medication settings span several top-level schema keys;
`Drug` reference data belongs to Medications, Vaccines and Invoicing at once; and the Medications and
Dispensing guides deliberately split the `medications.dispensing` subtree between them.

So **discover candidates mechanically, then confirm them with the author**:

- **Settings** — `packages/settings/src/schema/{global,central,facility}.ts`. Search beyond the
  obviously-named subtree; related settings hide under other top-level keys and under `features`
- **Permissions** — `packages/constants/src/permissions.ts`. Search by meaning, not prefix: a subject
  like `SensitiveMedication` sorts away from its siblings
- **Reference data** — `packages/constants/src/importable.ts` for the types, then the importers
  (`packages/central-server/app/admin/referenceDataImporter/`), import schemas
  (`.../admin/importSchemas/`) and exporters (`.../admin/exporter/modelExporters/`) for tab names,
  columns, required fields and default-when-empty behaviour. `defaultProvisioningData/*.json5` gives
  realistic example rows

Present the candidate list for the author to approve or trim **before authoring anything**. Do not
derive scope and proceed.

### Gather what the code cannot give you

Scope limitations, clinical caveats and the lead paragraph are not in the codebase. Ask the author for
them. Where they are outstanding, leave a marked gap rather than inventing them, and **never fabricate
clinical guidance**. Screenshots cannot be captured from code either, so leave marked placeholders.

### Batch your checkpoints

Three things need the author: the scope, the capabilities listed under each permission, and the version
a feature became available. Run separately these turn the skill into an interrogation, and a
guide-authoring skill that asks a dozen questions will not get used.

Settle **scope first**, since everything downstream depends on it. Then derive the permission
capabilities (from where each permission is enforced) and the version flags (from release branch
history, see `llm/project-rules/release-branches.md`) and present them **together as one review**.

### Report gaps, never widen scope

You will find configuration the guide does not document. Report it to the author and leave it out
unless they ask for it. An omission is often deliberate: the configuration may belong to an adjacent
module's guide, or cover something not yet supported for deployments. Correcting a fact the guide
already documents is not widening scope, and you should always do it.

### Updating proposes a diff

When updating an existing guide, **present the changes for the author to accept rather than editing the
guide directly**. The risk worth designing against is not missing an update, it is silently overwriting
narrative, caveats or placeholders that someone wrote deliberately.

### Landing the change

Update the module README and the `docs/user-manuals/system-administration/` README so the new or
changed guide is listed, then open a **pull request for review**.

Title it to Tamanu's conventional commit format (see `llm/project-rules/pull-requests.md`) — note that
`docs` is not an allowed type, so use `chore` — and use the repository template with the placeholder
replaced. Summarise what you wrote, and **report the configuration gaps you found** in the PR so a
reviewer sees them in context.
