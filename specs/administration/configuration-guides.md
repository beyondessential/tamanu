---
id: CFGDOC
---

# Configuration guides

User configuration guides document how to configure a Tamanu module: its reference data, settings and
permissions. They are written for system administrators and project managers who are configuring a
deployment and training staff, and assume a basic understanding of Tamanu and digital systems rather
than clinical or developer knowledge.

Guides are authored from the codebase, so the configuration they describe matches what the software
actually does. A dedicated skill drafts new guides, updates existing ones, and publishes them.

## Location and navigation

- [ ] Configuration guides live under `docs/user-manuals/system-administration/`.
- [ ] Each Tamanu module has its own folder within that directory, holding one or more topic guides
      rather than a single combined document.
- [ ] Guide filenames use lowercase kebab-case, as does the module folder name.
- [ ] `docs/user-manuals/system-administration/` carries a README listing each module and its guides.
- [ ] Each module folder carries a README listing that module's topic guides.
- [ ] Publishing or updating a guide updates the affected README entries.

## Guide structure

- [ ] A guide opens with a lead paragraph rather than a top-level heading, naming its audience,
      pointing to the module's implementation guide where one exists, and stating any scope
      limitations for the module.
- [ ] Sections appear in a fixed order: reference data types, hard-coded fields, settings, feature and
      workflow sections, then permissions.
- [ ] Each reference data type states its purpose, names its import spreadsheet tab, presents its
      columns as a table describing each column's meaning and its behaviour when left empty, and marks
      required columns.
- [ ] Reference data types that are populated from elsewhere in Tamanu, such as the prescriber list
      drawn from active users, are described in prose and point at the relevant guide.
- [ ] Hard-coded fields are listed as the values they permit, with a note that changing them requires a
      code change requested through a system administrator or project manager.
- [ ] Each setting states its scope, category, sub-category and name. Settings taking structured values
      also show the required format and the errors raised by invalid input.
- [ ] Feature and workflow sections are self-contained and state what requires configuration and what
      works without it.
- [ ] Permissions are grouped by functional area. Each entry pairs a verb with a permission subject and
      lists the capabilities it grants.
- [ ] A guide's permissions section covers the permissions needed to import and export reference data
      and to view and modify settings.

## Content sources

- [ ] Reference data columns, settings and permissions are derived from the codebase: the settings
      schemas for scope, category, default value and description; the permission definitions for
      subjects and their verbs; and the reference data importers and exporters for spreadsheet tabs and
      columns.
- [ ] Reference data column tables are rendered in the guide itself, and links to downloadable example
      templates are retained alongside them.
- [ ] User interface labels, conditional displays and automated behaviours described in a guide match
      the implementation.
- [ ] Narrative content that the codebase cannot supply, including scope limitations, clinical caveats
      and the lead paragraph, is provided by the guide's author. Where it is outstanding, the guide
      carries a marked gap for the author to complete.
- [ ] The capabilities listed under each permission are derived from where that permission is enforced,
      and presented to the author to confirm or correct before publishing.
- [ ] Guides are written in Australian English.

## Version flagging

- [ ] Features, settings and columns that are unavailable in older deployments carry a version note
      stating the version from which they are supported.
- [ ] Version notes are written as prose where they apply: within the heading of the section they
      qualify, or within the specific table cell or line.
- [ ] The version a feature became available is derived from the release branch history and presented
      to the author to confirm or correct before publishing.

## Images

- [ ] Where a guide benefits from a screenshot, it carries a caption and a marked placeholder
      identifying the image needed.

## Cross-references

- [ ] A reference to another guide resolves to a relative link when that guide exists under
      `docs/user-manuals/`, and otherwise links to the guide's current published location.

## Drafting and updating

- [ ] The skill drafts a guide for a module or topic named when it runs, and updates guides that
      already exist by reconciling them against the current codebase.
- [ ] Before authoring, the skill presents the configuration it proposes to document, covering the
      settings, permission subjects and reference data types in scope, for the author to approve or
      trim.
- [ ] Updating an existing guide presents the changes for the author to accept rather than editing the
      guide directly, so that author-written content is preserved.
- [ ] Configuration found in the codebase but absent from a guide is reported to the author, and the
      guide's scope is widened only when the author asks for it.

## Publishing

- [ ] Guides are published as a pull request for review.
- [ ] Pull request titles follow the repository's conventional commit format, and the pull request uses
      the repository template.
- [ ] The pull request reports any configuration gaps the skill found.
