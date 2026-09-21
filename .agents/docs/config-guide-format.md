# Configuration guide format

What a Tamanu configuration guide looks like. The procedure for producing one is in the
`draft-config-guide` skill, which cites this doc rather than repeating it.

**Audience.** System administrators and project managers configuring a deployment and training staff.
Assume basic Tamanu and digital literacy, not clinical or developer knowledge.

**Principles.**

- **Verify everything against code.** Field names, UI labels, button text, conditional displays,
  validation and automatic behaviour. Never guess or carry a claim over from an existing document
- **Keep out developer detail.** No database tables, schema, internals or architecture. Do include
  concrete steps, what each field means and when to use it, realistic examples, and what staff see
- **Reference data is configured by spreadsheet**, not a UI form. Write "download the reference data
  export, open the Drug tab, add rows with these columns", not "navigate to Drugs and click Add"
- **Distinguish similar actions.** Where two actions look alike, say what differs and when to use each
- **Say it once.** If it is explained elsewhere, cross-reference instead of restating
- **Do not tell project managers their job.** No best-practice sections, training advice,
  troubleshooting tips or summary checklists
- **Australian English.**

## Location and numbering

Guides live under `docs/user-manuals/config-guides/`, one folder per module, in lowercase
kebab-case. Each module folder holds three guides with fixed names — `reference-data.md`,
`settings.md`, `permissions.md` — plus a `README.md`.

Modules are numbered in the section README, in the order a deployment is set up and used rather than
alphabetically. A module's guides are numbered within it: module 15 is Medications, and its settings
guide is 15.2. The number appears in the module README heading (`# 15. Medications`) and in the README
tables. Numbering stops there; a guide's own sections are titled, not numbered.

Numbers are **not** part of folder or file names, so renumbering never breaks a link. Adding a module
means creating its folder and README at the right point in the order, then renumbering those below it,
which is an edit to the section README rows and the affected module README headings only.

Publishing or updating a guide updates both the module README and the section README.

## Structure

Each guide covers one configuration surface:

| File | Number | Covers |
| --- | --- | --- |
| `reference-data.md` | *n*.1 | Reference data types, and the hard coded values their columns accept |
| `settings.md` | *n*.2 | Settings, and the automated behaviour they drive |
| `permissions.md` | *n*.3 | Permissions, and features gated entirely by permission |

This matches how the work is done: reference data is imported, settings are set in the admin panel,
permissions are assigned to roles.

Each guide opens with a **lead paragraph and no H1** (the title displays separately), naming what it
covers and linking to its two siblings. Use horizontal rules between major sections.

**The module README** carries the overview, a pointer to the implementation guide, scope limitations,
and anything belonging to no single surface.

Sections within each guide:

- `reference-data.md` — `# Reference Data Types`, one `##` per type, each with a details table, then a
  columns table. Then `# Hard coded fields`: the values each field permits, noting that changing them
  needs a code change requested through a system administrator or project manager
- `settings.md` — `# Settings`, then feature and workflow sections stating what needs configuring and
  what works without it
- `permissions.md` — `# Permissions` grouped by functional area, then permission-gated features

**Cross-cutting sections** go where a reader would look: permitted values with the reference data that
accepts them; behaviour a setting turns on with that setting; a permission-gated feature with its
permissions, even when switched on elsewhere. Where a section spans two guides, put it where its first
configuration step happens and cross-reference the other.

## How guides render

Markdown carries structure, not styling. GitHub strips style and class attributes, so a guide cannot
control its colours or borders there.

| Element | On GitHub | On the docs site |
| --- | --- | --- |
| Callouts | Coloured, with icon | Coloured, per the design |
| Tables | GitHub's styling | Tamanu blue headers |
| Required marker | A plain `*` | Coloured `*` |
| Screenshot placeholders | A plain blockquote | Marked placeholder panel |

Consequences: **never rely on styling to carry meaning** (which is why the `*` convention is stated in
words above each table), and **do not hand-write HTML to recover a design** GitHub will strip. Put
structured content in **tables**, the one grouping construct that survives both renderings.

## Settings blocks

Order each setting **heading, description, then the block**. Anything listing the setting's possible
values goes after the block.

```markdown
| Field | Value |
| --- | --- |
| Scope | Facility (single facility) |
| Category | Medication |
| Sub-category | Pharmacy orders |
| Setting | Default prescription type |
| Default | Existing encounter type |
```

Keep all five rows, in that order. **Default** is the value that applies when the setting is untouched,
in the reader's terms: `Disabled` for a false boolean, the display label for an enumeration, the value
with its unit where the schema declares one. Where a default is computed, say what determines it. A
setting with no `defaultValue` is required or secret — say which.

Settings taking structured values also show the required format and the errors invalid input raises.

## Tables

Keep the first column the thing being looked up.

**Reference data details**, opening each type:

```markdown
| Field | Value |
| --- | --- |
| Tab name | `Drug` |
| Example template | [Drugs reference data template](https://example.com/drugs) |
```

Omit the template row where none exists. Templates are the downloadable spreadsheets the deployment
team already maintains; carry the link across from the existing documentation rather than generating a
file.

**Column tables** use `Column name | Description`:

```markdown
| Column name | Description |
| --- | --- |
| id * | Unique id for the drug. Letters, numbers and hyphens only. |
| dispensingUnit | The unit pharmacy dispenses in. Defaults to the dosing unit if not set. |
```

- Mark required columns with `*`, and state `Where * is a required field.` once above the table. The
  marker means the reader must supply a value; where the importer does not enforce it, say so
- Column names go in the left cell as they appear in the spreadsheet header, unadorned
- **Every optional column says what happens when it is left empty**
- **Only list real headers.** Where a sheet accepts variable headers, such as the drug sheet reading
  any unrecognised header as a facility id, describe that below the table. A placeholder row reads as a
  literal header, and someone will type it in
- Order columns to match the exported spreadsheet, so the table and the sheet can be read together.
  Importers read by header name, so the order is for the reader

**Permitted values** give both forms where they differ: `| Value | Displays as |`, e.g.
`| intramuscular | IM |`.

Keep cells to a sentence or two, and add a column only where it earns its place for every row. Alerts
cannot sit in a table cell, so anything needing a callout goes outside the table.

## Callouts

Use GitHub's alert syntax, which renders in colour on both surfaces:

| Kind | Syntax | Renders | Use for |
| --- | --- | --- | --- |
| Note | `> [!NOTE]` | Blue | General information, and version availability |
| Configuration tip | `> [!TIP]` | Green | Advice that makes configuration easier |
| Required | `> [!CAUTION]` | Red | Something that must be configured, or the workflow breaks |
| Warning | `> [!WARNING]` | Amber | A configuration trap or risk |

`[!IMPORTANT]` is unused: it renders purple, outside the palette, so required content takes
`[!CAUTION]`. **Alerts cannot nest inside other elements**, though lists and code blocks inside an
alert are fine. **Do not stack alerts** — GitHub advises against consecutive ones. Where two would sit
together, merge them or leave one as prose.

## Version flagging

Flag anything unavailable in older deployments with the version it is supported from, as **prose where
it applies**: in the heading it qualifies (`# Sensitive medications (supported from v2.39 onwards)`) or
in the specific table cell. Where the consequence needs spelling out, follow the heading with a
`> [!NOTE]` saying what earlier deployments cannot do.

## Screenshots

Images live in an `images/` folder beside the guide, named for what they show in kebab-case.

Where an image does not exist yet, leave a placeholder naming **both the file and what it must show**:

```markdown
> **Screenshot needed:** `images/new-prescription-medication-field.png` — the Medications field in the
> new prescription form, showing drugs reference data populating the dropdown.
```

Naming the file is what lets the capture spec and the guide agree without a separate manifest. Once
captured it becomes `![caption](images/new-prescription-medication-field.png)`.

## Cross-references

Link to another module with a relative path (`../dispensing/`) where it exists under
`docs/user-manuals/`, and otherwise to its current published location so nothing dangles. Between the
three guides of a module, link with a relative file and anchor
(`[Frequency](reference-data.md#frequency)`).

Check anchors when a heading moves: heading text repeats across sections, and the second occurrence is
suffixed, so a bare slug silently lands on whichever comes first. A version note in a heading is part
of its anchor.

## Accuracy rules

These are the ways a guide goes quietly wrong.

- **Copy identifiers verbatim.** Permission subjects and their verbs are exact strings an administrator
  types into a role, and a near-miss fails silently: a role against a subject that does not exist grants
  nothing, with no error. `Setting` is singular
- **Do not claim enforcement that does not happen.** Where a column is unvalidated, say so, because an
  invalid value is accepted silently rather than erroring
- **Never state a configurable value as a fixed fact.** Where a figure is a setting's default rather
  than a constant, say so and name the setting. Check which it is before writing it as either
- **Describe the round trip where a sheet is exported.** An exporter may write a value back in a
  different form from the one the importer accepts, and administrators export, edit and re-import
