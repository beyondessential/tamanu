# Reference data importer for sensitive networks + guard against removal

Two pieces: make `sensitiveNetwork` a first-class importable reference data type with a network
column on the facility sheet, and stop any write from changing a facility's network once the facility
exists. Spec: `specs/sync/sensitive-networks.md` (SENSNET).

Stacked on V6 (`workhorse/v6`), which is stacked on U6. The `SensitiveNetwork` model,
`Facility.sensitiveNetworkId`, and the migrations all arrive from those cards; nothing here adds
schema.

## The trap: an empty cell must not read as a removal — checked, does not bite

Checked before writing anything else. **Both halves are safe, and `sensitiveNetworkId` can be
declared on the yup `Facility` schema normally.**

- `importSheet` calls `utils.sheet_to_json(sheet)` with no `defval` for every sheet but drugs, so an
  empty cell contributes no key to the row object.
- yup 0.32.11 omits a declared-but-absent optional field from its cast output entirely — the key is
  not present, not `undefined`. Verified by casting a facility row with no network column through a
  schema shaped like the real one.

So `normalizedValues` never carries a `sensitiveNetworkId` key unless the sheet supplied a value,
`existing.set()` does not touch the column, and the guard does not fire on unrelated imports. The
reasoning that follows is kept because it is what the regression test protects.

`importRows` normalises `undefined` to `null` before writing:

```js
const normalizedValues = { ...values };
Object.keys(normalizedValues).forEach(key => {
  if (normalizedValues[key] === undefined) normalizedValues[key] = null;
});
```

then `existing.set(normalizedValues)` and `existing.save()`.

Had yup's cast included declared-but-absent keys as `undefined`, they would become `null`, `set()`
would clear the network, the guard would fire, and **every facility row in every unrelated import
would be refused** — a total breakage of facility imports, not a subtle bug.

One half of this does bite, and is handled. A genuinely blank cell produces no key, but a cell
holding an explicit empty string survives the cast as `''`, which `set()` writes as a change and the
guard refuses. The schema transforms `''` back to `undefined` so both spellings of "empty" mean the
same thing.

`visibilityStatus` would dodge this regardless by carrying a `.default(...)`, and `catchmentId` by not
being declared on the schema at all.

The test "an existing facility re-imported with an empty network cell keeps its network" is the
regression guard, and matters more than most: a future yup upgrade changing this cast behaviour would
break every facility import at once.

## Registering the type

- `packages/constants/src/importable.ts` — `SENSITIVE_NETWORK: 'sensitiveNetwork'` in
  `OTHER_REFERENCE_TYPES`. Singular, as every value there is. This alone carries it into
  `GENERAL_IMPORTABLE_DATA_TYPES`, the importer and exporter data-type lists, and the admin panel's
  selectable types.
- `packages/constants/src/permissions.ts` — `SensitiveNetwork: [List, Read, Write, Create]` in
  `PERMISSION_SCHEMA`. `PERMISSION_NOUNS` would contain the noun regardless, since
  `REFERENCE_TYPES_NOUNS` derives it from `GENERAL_IMPORTABLE_DATA_TYPES`. The entry is needed for a
  different reason: `Permission.validatePermissionSchema` rejects any noun absent from
  `PERMISSION_SCHEMA` ("Permissions for noun ... are not defined in the schema"), and the admin
  panel's noun list is built from its keys. Without it no role could be granted the create and write
  permission that `referenceDataImporter` then demands.
- `packages/central-server/app/admin/importSchemas/baseSchemas.js` — a `SensitiveNetwork` schema:
  `Base.shape({ code: fieldTypes.code.required(), name: fieldTypes.name.required() })`. No
  `visibilityStatus`; the model has no such column.
- `packages/central-server/app/admin/referenceDataImporter/dependencies.js` — add
  `sensitiveNetwork: {}`, and change `facility: {}` to `facility: { needs: ['sensitiveNetwork'] }` so
  a single file can define a network and create facilities into it. A `needs` entry is satisfied by
  the type being imported *or* dropped, so a file with no network sheet still imports facilities.

Tab name comes free: `normaliseSheetName` runs `toCamelCaseSingular`, so both `Sensitive Network` and
`Sensitive Networks` resolve, and the exporter's `startCase` writes `Sensitive Network`.

**Raise before merging:** `TRANSLATABLE_REFERENCE_TYPES` is built from `OTHER_REFERENCE_TYPE_VALUES`,
so registering the type makes `generateTranslationsForData` create a `TranslatedString` row for every
network's `name`. Networks are administrative and never shown to a clinician, so these are inert rows.
Excluding them means changing how `TRANSLATABLE_REFERENCE_TYPES` is composed, which is a wider blast
radius than the noise is worth. Recommend accepting it and saying so in review.

## The provisioning completeness check

`packages/central-server/app/subCommands/provision.js` — add the type to
`EXCLUDED_FROM_FULL_IMPORT_CHECK`, with a comment in the style of the existing three: a deployment
with no confidential data has no networks, so an empty state is correct rather than incomplete.

This is not optional tidying. `validateFullReferenceDataImport` requires a populated sheet for every
type in `GENERAL_IMPORTABLE_DATA_TYPES`; miss this and `provision` throws, the central-provisioner
deploy job fails, and central-api never starts. Do it in the same commit as the constants change so
the two never land apart.

No `defaultProvisioningData/Sensitive Network.json5` — seeding one would create a network no facility
joins, in every demo environment.

## The guard

Enforced on the `Facility` model so it holds on every path that writes a facility, with the importer
inheriting it rather than reimplementing it. The two live paths are the reference data import
(`existing.set(...)` then `existing.save()`) and `provision.js`'s own facilities block
(`facility.update(fields)`) — both instance-level, so an instance validator fires on both.

Rule: on an existing record, `sensitiveNetworkId` may not change. Creation is unrestricted. Message
names the facility and states that only a new facility can be enrolled in a network.

Points to get right:

- **Guard the change, not the value.** Re-importing an unchanged file re-applies the same network to
  a facility that already has it. That must pass, or a repeated deploy or a routine re-import fails.
  `changed('sensitiveNetworkId')` is the right signal — the same one `checkForChanges` already uses.
- **Both directions and the null case.** Set-from-null, cleared-to-null, and A-to-B are all refused.
  Sole membership is not an exemption.
- **Soft-deleted facilities are existing facilities.** `loadExisting` uses `paranoid: false`, and the
  importer calls `existing.restore()` before `set()`. So an undeleted facility reaches `save()` as an
  update and the guard applies — which is the specified behaviour, not an accident to work around.
- **Incoming sync must not be caught, and the isNewRecord check is what saves it.** Sync applies
  updates through `Model.update(values, { where })` (`saveChanges.ts`). That *does* validate — but
  against `this.build(values)`, a fake instance with `isNewRecord: true`, so the guard returns early.
  This matters more than it looks: once U6's backfill has run centrally, facility rows carrying a
  network sync down to facility servers that still hold those facilities with none, which is the
  refused transition. "Tightening" the guard to also catch bulk updates would break sync on every
  facility server in a deployment that has sensitive facilities.
- **Migrations must not be caught.** U6's backfill enrols existing sensitive facilities, which is
  exactly the forbidden transition. It writes through `query.sequelize.query`, so no model validator
  runs. This is why the guard belongs on the model and not in a database constraint — a `CHECK` or
  trigger would block the backfill.

## The importer fallback

The card allows for an importer-side fallback. `validateTableRows.js` is the right home if one is
wanted: it already loads existing rows to validate against the database and pushes row-level errors
carrying the sheet row number, which is how the refusal gets attributed to a row rather than
surfacing as a bare upsertion error.

Decide once the model guard is in and its error is seen in a real import result. If `UpsertionError`
already carries `sheetRow` and reads well in the admin panel, the fallback is duplicated logic that
can drift from the model — skip it. Add it only if the message is genuinely unattributable.

Either way the whole-file behaviour is free: `importerEndpoint` throws `rollback on errors` inside the
transaction, so one refused row abandons the import, and dry-run validation reports it identically.

## Export round-trip

Nothing to build, but it is the reason the import column is `sensitiveNetworkId` rather than
`networkId`. `ModelExporter.getHeadersFromData` emits raw model attribute names, so the facility sheet
exports `sensitiveNetworkId`. Had import read a different header, export → edit → re-import would
silently drop every facility's membership — and silently, because a missing column reads as "no
change", so the guard would not even fire.

`DefaultDataExporter` handles the network sheet with no new exporter class.

Cover the round-trip with a test, since it is the path an administrator actually takes and the failure
mode is invisible.

## Out of scope

The old `is_sensitive` column is already gone (U6). Deployments will still have spreadsheets carrying
an `isSensitive` column on the facility sheet; it is ignored rather than rejected. That relies on
unknown columns passing through yup and being dropped by Sequelize as unrecognised attributes —
verify it rather than assume it, but do not add handling for it.

Network deletion is specified in SENSNET but not reachable here: the reference data importer refuses
to delete anything outside a small allowlist of join models, and there is no admin-panel facility or
network editor. Nothing to build.

## Not verified here

`npm install` fails in this worktree: `xlsx` is declared as a remote tarball
(`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) and this environment refuses remote fetches
(`EALLOWREMOTE`), so no dependencies install and vitest cannot run. Nothing below marked as done has
been executed. What was checked instead: JavaScript syntax on every changed file, `tsc` on
`Facility.ts` (only unresolved-module noise, identical in kind to untouched sibling models), and the
yup cast behaviour run directly against yup 0.32.11.

The whole suite needs a run somewhere with dependencies installed before this is trusted.

## Surfaced by the first CI run

**Two sibling-card tests removed, not fixed.**
`CentralSyncManager.sensitiveFacilities.test.js` carried two edge cases from the pre-network
`is_sensitive` world, renamed mechanically by V6: "a facility changes from sensitive to
non-sensitive" and "a facility changes to sensitive". Both drive the transition through
`facility.update({ sensitiveNetworkId: ... })`, which the guard now refuses, and both describe
behaviour the spec has deliberately made unreachable. Keeping them by bypassing the guard with raw
SQL would assert desirable behaviour for a transition we have decided is unsafe. The migration path
that *can* still change membership is covered by V6's own lookup-rescope tests.

**Open question: should a network id be a UUID?** `SensitiveNetwork.id` is `DataTypes.UUID`, while
every other importable reference type — facility, department, location group, scheduled vaccine, lab
test panel, patient field definition — uses the standard string primary key, and the provisioning
data uses readable ids like `facility-DemoLan`. So the network sheet is the only one where an
administrator must supply a UUID, and supplying anything else surfaces a raw Postgres
`invalid input syntax for type uuid` rather than a row-level validation error.

Not changed here, for two reasons: the column belongs to U6, and switching it to a string would also
mean reworking U6's DDL, changing the backfill's `gen_random_uuid()` (it already derives code and
name from the facility, so the facility code is available), matching the `sync_lookup` column type,
and regenerating the dbt source models — which cannot be run in this worktree. No bespoke UUID
validator was added either, since that would formally commit the sheet to UUIDs, which is the
decision to be made rather than assumed. yup's own `.uuid()` is unusable regardless: its regex
requires RFC version 1-5 and Tamanu's generated ids carry version nibble `0`.

Raise with the user before merging.

## Build steps

- [x] Verify the empty-cell behaviour of the yup `Facility` cast, and settle whether
      `sensitiveNetworkId` is declared on the schema — declared, with an empty-string transform
- [x] `SENSITIVE_NETWORK` in `OTHER_REFERENCE_TYPES`, `SensitiveNetwork` in `PERMISSION_SCHEMA`, and
      the type in `EXCLUDED_FROM_FULL_IMPORT_CHECK` — one commit, so `provision` never breaks
- [x] `SensitiveNetwork` import schema in `baseSchemas.js`
- [x] `sensitiveNetwork` in `dependencies.js`, with `facility` needing it
- [x] Facility model validator refusing a change to `sensitiveNetworkId` on an existing record
- [x] Importer tests: network sheet import, facility enrolment at creation, one-file network plus
      facilities
- [x] Importer tests: each refusal case, including the soft-deleted facility and the unchanged
      re-import that must pass
- [x] Model-level tests for the guard
- [ ] Test that the backfill migration is unaffected
- [x] Export round-trip test
- [ ] `provision` with the default spreadsheet still succeeds
- [ ] Decide on the `validateTableRows` fallback once the real error message is visible
