# Configuration guide format

User configuration guides document how to configure a Tamanu module: its reference data, settings and
permissions. This doc defines their location, structure and authoring rules.

Authoring *principles* live in `llm/project-rules/write-config-guides.md` (audience, verifying
everything against code, no repetition, Australian English, import/export framing). Read that first;
this doc supplies the format those principles are expressed in.

**Audience.** System administrators and project managers configuring a deployment and training staff.
Assume a basic understanding of Tamanu and digital systems, not clinical or developer knowledge.

## Location and navigation

Guides live under `docs/user-manuals/system-administration/`.

- One folder per Tamanu module, holding **one or more topic guides** rather than a single combined
  document
- Lowercase kebab-case for both module folders and guide filenames
- `docs/user-manuals/system-administration/README.md` lists each module and its guides
- Each module folder carries a README listing that module's topic guides
- Publishing or updating a guide updates the affected README entries

## Structure

Open with a **lead paragraph, no H1** (the title is displayed separately). It names the audience,
points to the module's implementation guide where one exists, and states any scope limitations for the
module.

Then these sections, in this order:

1. **`# Reference Data Types`** — one `##` per type. Each type states its purpose, names its import
   spreadsheet **_Tab name_** in backticks, presents a **_Columns_** table (`Column name |
   Description`) marking required columns with `*` and describing each column's meaning and its
   behaviour when left empty, and links an **_Example reference data template_**. Nested types share a
   `##`. Types populated from elsewhere in Tamanu (the prescriber list, drawn from active users) are
   described in prose and point at the relevant guide rather than given a column table.
2. **`# Hard coded fields`** — the values each field permits, with a note that changing them requires a
   code change requested through a system administrator or project manager.
3. **`# Settings`** — each setting as a **Scope** / **Category** / **Sub-category** / **Setting**
   block. Settings taking structured values also show the required format and the errors invalid input
   raises.
4. **Feature and workflow sections** — self-contained, stating what requires configuration and what
   works without it.
5. **`# Permissions`** — grouped by functional area, each entry pairing a verb with a subject as
   `` `verb` for `Subject` `` and listing the capabilities it grants. Include the permissions needed to
   import and export reference data and to view and modify settings.

Use horizontal rules between major sections, and `##` / `###` for subsections. The Medications guide is
the reference example of this shape.

## Content sources

Derive from the codebase rather than from prose:

- **Settings** — the settings schemas (`packages/settings/src/schema/`) for scope, category, default
  value and description
- **Permissions** — the permission definitions (`packages/constants/src/permissions.ts`) for subjects
  and their verbs
- **Reference data** — the importers and exporters
  (`packages/central-server/app/admin/referenceDataImporter/`, `.../exporter/modelExporters/`) for tab
  names and columns; `defaultProvisioningData/*.json5` for realistic example rows

Also:

- Render reference data column tables **in the guide itself**, and retain links to downloadable example
  templates alongside them
- Verify UI labels, conditional displays and automated behaviours against the implementation
- **Author-supplied content.** Scope limitations, clinical caveats and the lead paragraph cannot come
  from code. Ask the author for them; where outstanding, leave a marked gap rather than inventing them.
  Never fabricate clinical guidance
- **Permission capabilities.** Derive the "what it unlocks" bullets from where each permission is
  enforced (`req.ability.can()` call sites), then present them to the author to confirm or correct.
  A call site shows what a permission guards, not what the capability is called

## Version flagging

Flag features, settings and columns unavailable in older deployments with the version they are
supported from.

- Write version notes as **prose where they apply**: within the heading of the section they qualify
  (`# Sensitive medications (supported from v2.39 onwards)`) or within the specific table cell or line
  (`From v2.60 onwards, this column is superseded by dosingUnit`)
- Not a badge, blockquote or callout
- Derive the version from release branch history (see `llm/project-rules/release-branches.md`), then
  present it to the author to confirm or correct

## Images

Guides are screenshot-heavy, and screenshots cannot be captured from code. Where a guide benefits from
one, leave a caption and a **marked placeholder** identifying the image needed. Do not fabricate images.

## Cross-references

Link to another guide with a **relative link** when it exists under `docs/user-manuals/`. Otherwise
link to its current published location, so no reference dangles. As guides migrate, external links
become relative ones.

## Drafting and updating

The module or topic is named per run; there is no fixed migration order and no stored scope.

- **Confirm scope first.** Present the configuration proposed for documentation, covering settings,
  permission subjects and reference data types, for the author to approve or trim. Scope cannot be
  derived from code alone: a module's settings span several top-level keys, and a type like `Drug`
  belongs to Medications, Vaccines and Invoicing at once
- **Updating proposes a diff.** Present changes for the author to accept rather than editing a guide
  directly, so author-written narrative, caveats and placeholders are never silently overwritten
- **Report gaps, never widen scope.** Configuration found in the codebase but absent from a guide is
  reported to the author. An omission may be deliberate, so document it only when asked
- **Batch the checkpoints.** Scope, permission capabilities and version flags each need author
  confirmation. Settle scope first, then review derived permission bullets and version flags together.
  A guide-authoring skill that asks a dozen questions will not get used

## Publishing

Publish as a pull request for review, never a silent edit.

- Title follows the repository's conventional commit format (see
  `llm/project-rules/pull-requests.md`). `docs` is not an allowed type in Tamanu; use `chore`
- Use the repository template, with the placeholder replaced
- Report any configuration gaps found in the pull request
