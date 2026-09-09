# Test cases: config guide authoring skill

Scenarios verifying the configuration-guide skill against the format standard in
`.agents/docs/config-guide-format.md`. Section groupings below mirror that doc's sections.

The highest-value check is the **Medications benchmark**: run the skill against the Medications module
and compare its output against the existing published guide, whose facts are known good. Most cases are
manual verification of a skill run rather than automated tests, since the output is a document.

## Medications benchmark

- [ ] Running the skill against the Medications module produces a guide whose reference data column
      tables match the published guide's columns for `Drug`, including `dosingUnit`, `dispensingUnit`,
      `unitConversion`, `notes`, `isSensitive` and the per-facility stock columns.
- [ ] The `Medication Template` and `Medication Set` types are documented with their tab names and
      required columns marked.
- [ ] The generated permissions section covers `Medication`, `SensitiveMedication`,
      `MedicationAdministration` and `MedicationPharmacyNote` with the correct verbs.
- [ ] Sections appear in the specified order: reference data, hard-coded fields, settings, feature and
      workflow sections, permissions.
- [ ] The guide opens with a lead paragraph and no top-level heading.

## Code-derived accuracy

- [ ] A settings block's scope, category and sub-category match the settings schema for that leaf,
      including a setting that lives outside the module's main subtree (such as medication
      administration record generation).
- [ ] A setting taking structured values shows its required format and the errors invalid input raises.
- [ ] Permission verb and subject pairs match the permission definitions, and the capabilities listed
      under each verb are presented for confirmation before publishing.
- [ ] Hard-coded fields are listed with the note that changing them requires a code change.
- [ ] A reference data type populated from elsewhere, such as the prescriber list, is described in
      prose rather than given a column table.

## Scope confirmation and gaps

- [ ] The skill presents its proposed scope, covering settings, permission subjects and reference data
      types, before authoring anything.
- [ ] Trimming an item from the proposed scope excludes it from the authored guide.
- [ ] A reference data type shared across modules, such as `Drug`, can be included or excluded per run
      without affecting other guides.
- [ ] Permission subjects present in the codebase but absent from the guide, such as
      `MedicationDispense` and `MedicationRequest`, are reported to the author and are not added to the
      guide unasked.
- [ ] Reported gaps appear in the pull request.

## Update mode

- [ ] Updating a guide presents the proposed changes for acceptance rather than writing to the file
      directly.
- [ ] Author-written narrative, clinical caveats and screenshot placeholders survive an update
      unchanged.
- [ ] After a setting is added to the schema, an update run surfaces it.
- [ ] After a setting's default changes, an update run reflects the new default.

## Author-supplied content

- [ ] Narrative content the codebase cannot supply is requested from the author, and outstanding
      content is left as a marked gap rather than invented.
- [ ] Clinical scope limitations are not fabricated when the author supplies none.
- [ ] Where a screenshot is needed, the guide carries a caption and a marked placeholder.

## Version flagging

- [ ] A feature with a known introduction version, such as sensitive medications, has its version
      derived from release branch history and presented for confirmation.
- [ ] Version notes render as prose in the qualifying heading or table cell, not as a separate badge or
      callout.
- [ ] Correcting a derived version at the confirmation step is reflected in the published guide.

## Location, navigation and links

- [ ] A guide is written to `docs/user-manuals/system-administration/{module}/{topic}.md` in
      kebab-case.
- [ ] Publishing a second guide in a module updates both the module README and the
      `system-administration/` README, adding entries rather than replacing or duplicating them.
- [ ] A reference to a guide already under `docs/user-manuals/` resolves to a relative link.
- [ ] A reference to a guide not yet migrated links to its current published location and does not
      dangle.
- [ ] Reference data column tables render inline, with downloadable template links retained alongside
      them.

## Publishing

- [ ] The pull request title passes the repository's conventional commit CI check, using an allowed
      type and carrying the card ticket.
- [ ] The pull request uses the repository template with the placeholder replaced.
- [ ] Guides are written in Australian English.

## Usability

- [ ] A full run's author checkpoints are batched, so scope is settled in one pass and derived
      permission bullets and version flags are reviewed together, rather than asked one at a time.
