---
status: draft
---

# Config guide authoring & publishing skill

A new Tamanu skill that drafts, updates and publishes user configuration guides for a Tamanu
module — grounded in the current code — and files them into this repo's `docs/` tree, so the
System Administration documentation now in Slab can be migrated to GitHub.

## Overview

The skill's core competency: point it at a Tamanu module, and it reads that module's reference
data, settings and permissions out of the codebase, verifies UI labels and workflows against the
implementation, and produces a configuration guide matching the house format (modelled on the
Medications guide). It also updates existing guides by re-verifying them against current code. Output
lands as markdown in `docs/user-manuals/system-administration/{module}/`, published as a reviewed PR.

## Behaviour

### Deliverable & shape

- A new skill folder `.agents/skills/{name}/SKILL.md` with the standard frontmatter
  (`name`, `description`, `label`, `workhorse-version`) and a prompt body — structured like the
  existing `curate-support-docs` skill.
- The skill **cites** `llm/project-rules/write-config-guides.md` for authoring principles rather than
  duplicating it. That rule supplies the *principles* (audience, verify-everything-from-code, no
  repetition, don't-tell-PMs-their-job, Australian English, import/export spreadsheet framing). The
  Medications guide supplies the *section template*.

### Two modes

- **Draft a new guide** for a module (or a topic within a module).
- **Update an existing guide** — re-read the relevant code, reconcile the guide against current
  behaviour, and surface what changed.

### Where guides live

- Root: this repo's `docs/` folder.
- Tree: `docs/user-manuals/system-administration/{module}/{topic}.md` (kebab-case slugs — *tentative,
  see open questions*).
- One folder per Tamanu module; **multiple topic guides** per module folder (not one monolith).

### Audience & voice

- One guide serving **both system administrators and project managers** — plain language, assuming
  basic Tamanu + digital literacy, not clinical or developer knowledge.
- Australian/NZ English throughout.

### Authoring grounded in code (author fresh from code)

Each run the skill infers the module's configuration surface from the codebase — it does not depend
on the Slab text:

- **Settings** — from `packages/settings/src/schema/` (`global.ts` / `central.ts` / `facility.ts`),
  reading scope, category/sub-category, default value, and flags.
- **Permissions** — from `packages/shared/src/permissions/` and the permission subjects the module
  uses.
- **Reference data** — the reference-data types the module consumes and their importer columns
  (required vs optional, default/empty behaviour, hard-coded enumerations).
- UI labels, button text, conditional displays and automated behaviours verified against the
  implementation, per `write-config-guides.md`.

### Guide format (from the Medications example)

The canonical section backbone, in order:

1. **Lead paragraph, no H1** — audience, a pointer to the module's Implementation Guide, and
   scope/exclusions (what the module should *not* yet be used for).
2. **`# Reference Data Types`** — one `##` per type. Each type carries: purpose; the spreadsheet
   **_Tab name_** in backticks; a **_Columns_** table (`Column name | Description`) with `*` marking
   required fields and per-column default/empty behaviour; and an **_Example reference data
   template_** link. Nested types share a `##`. Types populated elsewhere (e.g. Prescriber ← users)
   are described, not tabled.
3. **`# Hard coded fields`** — enumerations that aren't configurable, each with the "request a code
   change to alter" note.
4. **`# Settings`** — each setting as a **Scope** / **Category** / **Sub-category** / **Setting**
   block, with JSON format examples and error states where relevant.
5. **Feature / workflow sections** — self-contained sections for notable features and automated
   workflows (e.g. sensitive medications, auto-discontinuation, due tasks), each stating what needs
   configuring vs what works out of the box.
6. **`# Permissions`** — grouped by functional area, each as `` `verb` for `Subject` `` with a bullet
   list of exactly what it unlocks; includes an admin-panel group covering `ReferenceData` and
   `Settings` permissions.

### Version flagging

- Features/columns not present in every deployment are flagged with **inline prose**, phrased plainly
  and placed where they apply — a parenthetical in the heading (`# Sensitive medications (supported
  from v2.39 onwards)`) or a line in the specific table cell/section (`From v2.60 onwards, this column
  is superseded by dosingUnit`). Not a styled badge or blockquote.
- *How the skill determines the version a feature landed is an open question (see below).*

### Images

- The skill can't capture live UI screenshots when authoring from code. Where the guide needs one, it
  inserts a **marked placeholder** — a caption plus a clear "screenshot needed" marker — for a human
  to fill before or after the PR merges. It does not fabricate images.

### Non-code (narrative & clinical) content

- Content that isn't derivable from code — scope exclusions ("IV infusions stay on paper"), clinical
  caveats, the lead-paragraph framing — is **provided by the author**. The skill asks the invoker for
  it, or leaves clearly-marked gaps for them to write, rather than inventing clinical guidance. Only
  the reference-data / settings / permissions sections are authored autonomously from code.

### Example templates & external assets

- Reference-data column definitions are rendered as **inline markdown tables** (as the example
  already does), so the guide is self-contained. **External template links** (Google Sheets
  downloadable templates, the hard-coded-lists spreadsheet) are **kept** alongside the inline tables.

### Cross-references between guides

- When a guide references another guide, the skill checks whether that target has been migrated: if it
  lives in `docs/user-manuals/` already, use a **relative link**; if it's still in Slab, **keep the
  working Slab link** so nothing dangles. As migration proceeds, Slab links get swapped to relative
  links.

### Navigation index

- The skill maintains a navigation index: a **README in `system-administration/`** listing modules and
  their guides, and a **per-module README** listing that module's topic guides — modelled on the
  support pack's `docs/README.md`. Publishing or updating a guide updates the relevant index.

### Publishing

- The skill authors the file(s) and opens a **reviewed pull request** — never a silent edit.
- PR title follows Tamanu conventions (`chore`, since `docs` is disallowed; `no-issue` or the card
  ticket), and the PR uses the repo template. See `git-workflow.md` / `pull-requests.md`.

## Open questions

- [ ] **Initial migration scope.** Which modules migrate first (Medications plus what)? Seeds the tree
      and gives real test cases.
- [ ] **How the skill maps "module → its config".** "Infer from code each run" — what anchors the
      search (a module name, a settings category, a permissions subject prefix)? Reference data and
      settings aren't formally grouped by "module" in code, so the skill needs a reliable way to scope.
      Likely resolved at Tech design rather than here.

## Testing notes

- Run the skill against the **Medications** module and diff its output against the existing Slab guide
  — the code-derived sections (reference data columns, settings scope/category, permission verbs)
  should match the real guide's facts.
- Verify a settings block's Scope/Category/Sub-category against `packages/settings/src/schema/`.
- Verify a permissions group's `verb`/`Subject` pairs against the permission definitions.
- Update mode: run against a guide after a known code change (e.g. a setting added) and confirm the
  skill surfaces and reflects the change.
- Confirm the PR title passes Tamanu's conventional-commit CI check.
