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
3. **`# Settings`** — each setting as a **Scope** / **Category** / **Sub-category** / **Setting** /
   **Default** block, preceded by a short description of what the setting does (see
   [Settings blocks](#settings-blocks)). Settings taking structured values also show the required
   format and the errors invalid input raises.
4. **Feature and workflow sections** — self-contained, stating what requires configuration and what
   works without it.
5. **`# Permissions`** — grouped by functional area, each entry pairing a verb with a subject as
   `` `verb` for `Subject` `` and listing the capabilities it grants. Include the permissions needed to
   import and export reference data and to view and modify settings.

Use horizontal rules between major sections, and `##` / `###` for subsections. The Medications guide is
the reference example of this shape, and
`.workhorse/design/mockups/k8/config-guide.html` shows it rendered.

## Settings blocks

Order each setting as **heading, then description, then the block**, so the reader learns what a
setting does before being shown where to find it. Anything enumerating the setting's possible values
goes after the block.

The block carries five fields:

```markdown
**Scope:** Facility (single facility)

**Category:** Medication

**Sub-category:** Pharmacy orders

**Setting:** Default prescription type

**Default:** Existing encounter type
```

**Default** states the value that applies when the setting is untouched, taken from the schema's
`defaultValue`. Give it in the reader's terms rather than the stored form: `Disabled` for a boolean
defaulting to false, the option's display label for an enumeration, and the value with its unit where
the schema declares one. Where a default is computed per case, say what determines it rather than
inventing a single value.

A setting with no `defaultValue` in the schema is either required or secret. Say which, rather than
leaving **Default** blank.

## Tables

Tables carry the dense reference material: reference data columns, permitted values, and anything with
a per-row default. Keep the first column the thing being looked up, so a reader scanning the left edge
finds their row.

**Reference data columns.** Two columns, `Column name` and `Description`:

```markdown
| Column name | Description |
| --- | --- |
| id * | Unique id for the drug. Letters, numbers and hyphens only. |
| dispensingUnit | The unit pharmacy dispenses the medication in. Defaults to the dosing unit if not set. |
```

- Mark required columns with a space and `*` after the name, and state the convention once above the
  table: `Where * is a required field.`
- Column names go in the left cell **as they appear in the spreadsheet header**, unadorned. Do not
  wrap them in backticks; the whole column is identifiers, so backticks add noise without adding
  meaning
- Every optional column's description says what happens when it is left empty, either the default it
  takes or that no default applies. This is the question a reader most often brings to the table
- Order the columns as the importer expects them, so the table can be read alongside the spreadsheet

**Permitted values.** Where a stored value differs from what Tamanu displays, give both:

```markdown
| Value | Displays as |
| --- | --- |
| intramuscular | IM |
```

Where they are the same for every row, one column is enough. A long list of identical pairs is better
as prose or a comma-separated run than a two-column table repeating itself.

**Other tables.** Add columns only where each earns its place for every row. A column that is empty for
most rows belongs in the description cell of the rows that need it.

Keep cell content to a sentence or two. Where a value needs several paragraphs, a worked example or a
code block, give it its own subsection under the table and reference it from the cell. Alerts cannot be
nested in a table cell, so anything needing a callout also belongs outside the table.

## Callouts

Use GitHub's alert syntax, which renders in colour on GitHub and in the docs site. Four kinds, each
with a fixed meaning:

| Kind | Syntax | Renders | Use for |
| --- | --- | --- | --- |
| Note | `> [!NOTE]` | Blue | General information worth knowing, and version availability |
| Configuration tip | `> [!TIP]` | Green | Advice that makes configuration easier or better |
| Required | `> [!CAUTION]` | Red | Something that must be configured, or the workflow breaks |
| Warning | `> [!WARNING]` | Amber | A configuration trap, a risk, or a gap a feature does not yet fill |

```markdown
> [!TIP]
> Set default values for `route` and `dosingUnit` against each medication. The defaults populate
> automatically when the medication is selected, which speeds up creating prescriptions.
```

Notes on using them:

- **`[!IMPORTANT]` is not used.** It renders purple, which is outside the palette. Required content
  takes `[!CAUTION]` so it reads red
- **Alerts cannot be nested inside other elements**, so an alert cannot sit within a list or a table
  cell. Lists and code blocks inside an alert are fine
- **Do not stack alerts.** GitHub's own guidance is to avoid consecutive alerts and to use them
  sparingly. Where two would sit together, merge them or leave one as ordinary prose. A guide whose
  every second block is a coloured box teaches the reader to skip them

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
- Where the consequence needs spelling out, follow the heading with a `> [!NOTE]` callout saying what
  deployments below that version cannot do. Version availability is informational, so it takes the blue
  note rather than the amber warning
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
