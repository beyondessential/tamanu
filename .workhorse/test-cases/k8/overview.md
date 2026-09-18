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
- [ ] The module is documented as three guides (`reference-data.md`, `settings.md`, `permissions.md`)
      numbered 15.1 to 15.3, not as a single combined document.
- [ ] Sections land in the right guide: permitted values with the reference data that accepts them,
      automated workflows with the settings that drive them, and permission-gated features with the
      permissions that control them.
- [ ] Content belonging to no single surface (module overview, scope limitations, the IV medications
      explanation) sits in the module README rather than being forced into one of the three.
- [ ] Each guide opens with a lead paragraph, no top-level heading, and links to its two siblings.
- [ ] Cross-references between the three guides use a relative file and anchor, and every one resolves.

## Code-derived accuracy

- [ ] A settings block's scope, category and sub-category match the settings schema for that leaf,
      including a setting that lives outside the module's main subtree (such as medication
      administration record generation).
- [ ] A setting taking structured values shows its required format and the errors invalid input raises.
- [ ] Permission verb and subject pairs match the permission definitions, and the capabilities listed
      under each verb are presented for confirmation before publishing.
- [ ] Every `` `verb` for `Subject` `` pair in a published guide names a subject that exists in
      `packages/constants/src/permissions.ts` with that verb allowed. Subject names are exact
      identifiers, and a near-miss such as `Settings` for `Setting` grants nothing without erroring.
- [ ] Reference data column descriptions state the required input format where the importer parses the
      cell, such as `availableFacilities` needing a JSON array rather than a plain list.
- [ ] A column description does not claim enforcement the importer does not perform. Where a column is
      unvalidated, such as the Drug sheet's `route` or a medication set's `medicationTemplates`, the
      description says so, since an unvalidated value is accepted silently rather than erroring.
- [ ] Guides reference sibling modules with a relative link where that module exists under
      `docs/user-manuals/`, rather than naming it in prose.
- [ ] A figure that is a setting's default, such as the 8-hour upcoming task window, is described as a
      default with its setting named, not as a fixed fact.
- [ ] Where an exporter writes a column back in a different form from the one the importer accepts,
      such as the drug stock columns, the guide says what an export shows.
- [ ] Every optional column's description states what happens when the cell is left empty, with no
      column silently omitting it.
- [ ] Every in-guide heading anchor resolves to the intended section, including where two sections share
      heading text or a heading carries a version note.
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
## Screenshots

- [ ] Where a screenshot is needed, the placeholder names both the image file it is waiting for and
      what the image must show.
- [ ] A capture spec is written to `packages/e2e-tests/tests/docs/{module}-guide-screenshots.spec.ts`.
- [ ] The capture spec reuses existing page objects from `packages/e2e-tests/pages/` rather than
      introducing fresh selectors.
- [ ] Running the capture spec writes each image into the guide's `images/` folder under the exact name
      its placeholder gives, so no placeholder is left orphaned.
- [ ] The capture spec does not run as part of the normal Playwright suite, so a missing screenshot
      never fails the test run.
- [ ] Captured screenshots contain synthetic data only, with no patient identifiable information.
- [ ] A captured image replaces its placeholder with the caption preserved.
- [ ] An update run reports screenshots sitting in sections whose underlying code has changed, and does
      not silently recapture or delete them.
- [ ] A guide published with outstanding placeholders says so in the pull request and names the capture
      spec to run.

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
