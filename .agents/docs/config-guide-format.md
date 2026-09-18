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

- One folder per Tamanu module, holding **three guides** (`reference-data.md`, `settings.md`,
  `permissions.md`) rather than a single combined document
- Lowercase kebab-case for module folders. Guide filenames are the three fixed names above
- `docs/user-manuals/system-administration/README.md` lists each module and its guides
- Each module folder carries a README describing the module and listing its topic guides
- Publishing or updating a guide updates the affected README entries

**The tree is pre-scaffolded.** Every known module already has a folder and README, including modules
with no guide written yet, so the shape of the documentation is visible and the gaps are explicit.
Writing a guide therefore means filling an existing folder, not creating one: add the guide, replace
that module's "no configuration guide yet" line with a table listing it, and update the section README
row from "Not written yet" to a link. Add a folder only for a module the tree does not yet cover, inserting it at the point in the order
where it belongs and renumbering the modules below it. Renumbering means editing the section README
rows and each affected module README heading; nothing on disk is renamed.

### Numbering

Modules are numbered at the section level, and a module's guides are numbered one branch below it:
module 15 is Medications, and its settings guide is 15.2. A module's number appears in its README
heading (`# 15. Medications`), and its guides carry the two-part number in the README tables.

Numbering stops there. It does not continue into a guide's own sections, which are titled rather than
numbered.

Numbers are reference and ordering only, and are deliberately **not** part of folder or file names, so
renumbering never breaks a link or a cross-reference. Keep the section README, the module README
heading, and the guide's entry in step when a number changes.

## Structure

A module's configuration is documented in **three guides**, one per configuration surface, numbered
within the module:

| File | Number | Covers |
| --- | --- | --- |
| `reference-data.md` | *n*.1 | The reference data types the module needs, and the hard coded values their columns accept |
| `settings.md` | *n*.2 | The module's settings, and the automated behaviour those settings drive |
| `permissions.md` | *n*.3 | The permissions the module requires, and features gated entirely by permission |

Splitting by surface means a reader configuring reference data is not reading past settings they do not
need yet, and it matches how the work is actually done: reference data is imported, settings are set in
the admin panel, and permissions are assigned to roles.

Each guide opens with a **lead paragraph, no H1** (the title is displayed separately) naming what it
covers and linking to its two siblings.

**The module README carries what belongs to no single surface**: the module's overview, a pointer to its
implementation guide, scope limitations (which medications or settings the module is not recommended
for), and any explanatory material that is neither configuration nor behaviour. It is a short overview
with the guide table, not a bare index.

### Placing cross-cutting sections

Some sections do not sit in exactly one surface. Place each where a reader would go looking for it:

- **Permitted values** for reference data columns (units, routes, frequencies) go in the reference data
  guide, with the columns that accept them
- **Behaviour a setting turns on**, including automated workflows and anything the module generates on
  a schedule, goes in the settings guide
- **A feature gated by permission** goes in the permissions guide, even where it is switched on
  elsewhere. Sensitive medications is configured by a reference data column but is entirely a
  permissions feature, so it is explained alongside the permissions that control it
- Where a section genuinely spans two guides, put it where its **first** configuration step happens and
  cross-reference the other

### Sections within a guide

Within its own guide, each surface keeps the section shape below:

**In `reference-data.md`:**

1. **`# Reference Data Types`** — one `##` per type. Each type states its purpose, gives a details table
   carrying its import spreadsheet tab name and example template link (see
   [Reference data details](#reference-data-details)), then a columns table (`Column name |
   Description`) marking required columns with `*` and describing each column's meaning and its
   behaviour when left empty. Nested types share a `##`. Types populated from elsewhere in Tamanu (the
   prescriber list, drawn from active users) are described in prose and point at the relevant guide
   rather than given a column table.
2. **`# Hard coded fields`** — the values each field permits, with a note that changing them requires a
   code change requested through a system administrator or project manager.

**In `settings.md`:**

3. **`# Settings`** — each setting as a **Scope** / **Category** / **Sub-category** / **Setting** /
   **Default** table, preceded by a short description of what the setting does (see
   [Settings blocks](#settings-blocks)). Settings taking structured values also show the required
   format and the errors invalid input raises.
4. **Feature and workflow sections** — self-contained, stating what requires configuration and what
   works without it.

**In `permissions.md`:**

5. **`# Permissions`** — grouped by functional area, each entry pairing a verb with a subject as
   `` `verb` for `Subject` `` and listing the capabilities it grants. Include the permissions needed to
   import and export reference data and to view and modify settings.
6. **Permission-gated features** — sections explaining a feature whose behaviour is controlled by the
   permissions above.

Use horizontal rules between major sections, and `##` / `###` for subsections. The Medications guides
are the reference example of this shape. `.workhorse/design/mockups/k8/config-guide-split.html` shows
the three-guide structure, and `config-guide.html` and `config-guide-github.html` show a guide's
content rendered on the docs site and on GitHub.

### Cross-references between the three

Splitting by surface means a workflow spanning surfaces now spans files, so the links matter more than
they did. Link with a relative file and anchor (`[Frequency](reference-data.md#frequency)`). Check them
whenever a heading moves, since an anchor that was valid inside one document is silently wrong once its
target lives in another.

## How guides render

Guides are markdown, and markdown carries structure rather than styling. GitHub renders them with its
own theme and strips style and class attributes, so a guide cannot control its own colours, borders or
spacing there. Plan for two renderings of the same file:

| Element | On GitHub | On the docs site |
| --- | --- | --- |
| Callouts | Coloured, with icon. Native alert rendering | Coloured, per the design |
| Tables | GitHub's table styling | Tamanu blue headers |
| Required marker | A plain `*` character | Coloured `*` |
| Screenshot placeholders | A plain blockquote | Marked placeholder panel |
| Version flags | Plain text in the heading or cell | Tinted inline label |

Structured content goes in **tables** rather than runs of bold labels, because a table is the one
grouping construct that survives both renderings intact. This is why settings and reference data
details are tables: as loose `**Label:**` lines they hold together only where a design can draw a box
around them, and on GitHub they read as stranded bold text.

The design in `.workhorse/design/mockups/k8/config-guide.html` is the **docs site** target, not what
GitHub shows.

Two consequences for how you write:

- **Never rely on styling to carry meaning.** A callout must read correctly from its label and words
  alone, because on GitHub the settings block is just bold text and the required `*` is just an
  asterisk. This is why the required convention is stated in words above each table rather than left to
  the marker's colour
- **Do not hand-write HTML to recover the design.** GitHub permits only a narrow set of tags and strips
  the attributes that would style them, so it degrades to worse markup rather than a styled box

## Settings blocks

Order each setting as **heading, then description, then the block**, so the reader learns what a
setting does before being shown where to find it. Anything enumerating the setting's possible values
goes after the block.

The block is a two-column table carrying five fields:

```markdown
| Field | Value |
| --- | --- |
| Scope | Facility (single facility) |
| Category | Medication |
| Sub-category | Pharmacy orders |
| Setting | Default prescription type |
| Default | Existing encounter type |
```

Keep the five rows in that order, and include every row even where a value is obvious, so blocks stay
comparable at a glance across guides.

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

### Reference data details

Each reference data type opens with a details table, so its tab name and template link sit together
rather than as free-floating labelled lines:

```markdown
| Field | Value |
| --- | --- |
| Tab name | `Drug` |
| Example template | [Drugs reference data template](https://example.com/drugs) |
```

Where a type has no downloadable template, omit that row rather than leaving it empty.

### Column tables

**Reference data columns.** Two columns, `Column name` and `Description`:

```markdown
| Column name | Description |
| --- | --- |
| id * | Unique id for the drug. Letters, numbers and hyphens only. |
| dispensingUnit | The unit pharmacy dispenses the medication in. Defaults to the dosing unit if not set. |
```

- Mark required columns with a space and `*` after the name, and state the convention once above the
  table: `Where * is a required field.` The marker means the reader must supply a value. Where the
  importer does not actually enforce it, say so in that column's description, since a field that fails
  silently rather than erroring is exactly what a reader needs warning about
- Column names go in the left cell **as they appear in the spreadsheet header**, unadorned. Do not
  wrap them in backticks; the whole column is identifiers, so backticks add noise without adding
  meaning
- Every optional column's description says what happens when it is left empty, either the default it
  takes or that no default applies. This is the question a reader most often brings to the table
- Order the columns to match the exported spreadsheet, so a reader can work down the table and across
  the sheet in step. Importers read by header name, so column order does not affect the import itself;
  the ordering is for the reader
- **Only list real column headers.** Where a sheet accepts variable headers, such as the drug sheet
  reading any unrecognised header as a facility id, describe that in a section below the table rather
  than inventing a placeholder row for it. A placeholder name in the column table reads as a literal
  header, and someone will type it in

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
  and their verbs. **Copy each subject name verbatim** and confirm the verb is one the subject allows.
  These are exact identifiers an administrator types into a role, and a near-miss fails silently: a role
  configured against a subject that does not exist grants nothing, with no error. `Setting` is singular,
  and a subject's allowed verbs vary, so neither can be inferred from the surrounding prose or carried
  over from an existing document
- **Reference data** — the importers and exporters
  (`packages/central-server/app/admin/referenceDataImporter/`, `.../exporter/modelExporters/`) for tab
  names and columns; `defaultProvisioningData/*.json5` for realistic example rows

Also:

- Render reference data column tables **in the guide itself**, and retain links to downloadable example
  templates alongside them
- Verify UI labels, conditional displays and automated behaviours against the implementation
- **Never state a configurable value as a fixed fact.** Where a number in the prose is a setting's
  default rather than a constant, say so and name the setting, because a deployment that has changed it
  reads a guide that is wrong about its own behaviour. Check whether a figure is hard coded or a
  `defaultValue` before writing it as either. The same applies in reverse: a genuinely hard coded value
  is stated plainly, with the note that changing it needs a code change
- **Describe the round trip where a sheet is exported.** An exporter may write a value back in a
  different form from the one the importer accepts, and administrators routinely export, edit and
  re-import. Where the forms differ, say what an export shows
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

Guides are screenshot-heavy. Screenshots cannot be produced by reading code, so they are captured from
a running Tamanu instance by a Playwright spec the skill writes alongside the guide. Never fabricate an
image or describe one you have not seen.

**Image files** live in an `images/` folder beside the guide, at
`docs/user-manuals/system-administration/{module}/images/`, referenced relatively. Name each file for
what it shows, in kebab-case: `new-prescription-medication-field.png`.

**Placeholders.** Where a guide needs an image that does not exist yet, leave a placeholder naming both
the file it is waiting for and what the image must show:

```markdown
> **Screenshot needed:** `images/new-prescription-medication-field.png` — the Medications field in the
> new prescription form, showing drugs reference data populating the dropdown.
```

Naming the file in the placeholder is what lets the capture spec and the guide agree without a separate
manifest. Once captured, the placeholder becomes an ordinary image with the same caption:

```markdown
![The Medications field in the new prescription form.](images/new-prescription-medication-field.png)
```

### The capture spec

Write a Playwright spec that navigates to each screen and captures its image, and put it under
`packages/e2e-tests/tests/docs/{module}-guide-screenshots.spec.ts`.

- **Reuse the existing page objects** in `packages/e2e-tests/pages/` rather than writing fresh
  selectors. They already handle login, navigation and modals, and they are maintained alongside the UI
  they cover. `pages/facilityAdmin/SettingsPage.ts` covers the Settings admin panel, and
  `pages/patients/MedicationsPage/` the prescribing and administration screens
- **Write each file to the guide's `images/` folder** under the exact name its placeholder gives
- **Keep it out of the normal test run.** A capture spec navigates and captures, it does not assert, so
  a failing suite must not be the signal that a screenshot is missing. Tag or scope it as its own
  Playwright project
- **Use synthetic data only**, as the rest of the suite does. A screenshot is published, so it must
  never carry patient identifiable information
- Follow `llm/project-rules/playwright-e2e.md` for structure and locator strategy

Running it needs a local stack, so it is a separate step from authoring: the skill writes the spec and
says what to run, and a person runs it and commits the images.

### Keeping screenshots current

Screenshots go stale when the UI moves, and nothing in the markdown reveals that. On an update run,
**report which screenshots sit in sections whose underlying code has changed** since the image was last
captured, so a person can judge whether to recapture. Report them; do not silently recapture or delete.

## Cross-references

Link to another guide with a **relative link** when it exists under `docs/user-manuals/`. Otherwise
link to its current published location, so no reference dangles. As guides migrate, external links
become relative ones.

**Within a guide**, check that a heading anchor resolves to the section you mean. Heading text repeats
across sections — a feature section and its matching permissions subsection often share a name — and the
anchor for the second one is suffixed, so the bare slug silently lands on whichever comes first. Where a
heading carries a version note, that note is part of its anchor.

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
