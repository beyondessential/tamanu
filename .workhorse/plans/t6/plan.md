# Reference data importer for sensitive networks + guard against removal

Two pieces: make `sensitiveNetwork` a first-class importable reference data type with a network
column on the facility sheet, and stop any write from changing a facility's network once the facility
exists. Spec: `specs/sync/sensitive-networks.md` (SENSNET).

Stacked on V6 (`workhorse/v6`), which is stacked on U6. The `SensitiveNetwork` model,
`Facility.sensitiveNetworkId`, and the migrations all arrive from those cards; nothing here adds
schema.

## The trap: an empty cell must not read as a removal

The single most important thing to get right, and the one that fails silently in the wrong direction.

`importRows` normalises `undefined` to `null` before writing:

```js
const normalizedValues = { ...values };
Object.keys(normalizedValues).forEach(key => {
  if (normalizedValues[key] === undefined) normalizedValues[key] = null;
});
```

then `existing.set(normalizedValues)` and `existing.save()`.

So the question is whether the yup `Facility` schema emits a `sensitiveNetworkId` key at all when the
sheet has no such column, or has one with an empty cell. If yup's cast includes declared-but-absent
keys as `undefined`, they become `null`, `set()` clears the network, the guard fires, and **every
facility row in every unrelated import is refused** — a total breakage of facility imports, not a
subtle bug.

`visibilityStatus` dodges this by carrying a `.default(...)`. `catchmentId` dodges it by not being
declared on the schema at all: the FK resolution step adds the key only when the column is present.

**Verify this before writing anything else.** Cast a facility row with no network column through the
real schema and check whether the key is present in the output. Dependencies are not installed in
this worktree, so this needs an `npm install` first — do not take the above reasoning on trust.

Depending on the answer, either leave `sensitiveNetworkId` off the yup `Facility` schema and rely on
unknown-key passthrough (matching how `catchmentId` behaves), or declare it with a transform that
preserves absence. Either way the test "an existing facility re-imported with an empty network cell
keeps its network" is the regression guard.

## Registering the type

- `packages/constants/src/importable.ts` — `SENSITIVE_NETWORK: 'sensitiveNetwork'` in
  `OTHER_REFERENCE_TYPES`. Singular, as every value there is. This alone carries it into
  `GENERAL_IMPORTABLE_DATA_TYPES`, the importer and exporter data-type lists, and the admin panel's
  selectable types.
- `packages/constants/src/permissions.ts` — `SensitiveNetwork: [List, Read, Write, Create]` in
  `PERMISSION_SCHEMA`. Required, not optional: `referenceDataImporter` calls
  `checkPermission('create', upperFirst(dataType))`, and `PERMISSION_NOUNS` is built from
  `REFERENCE_TYPES_NOUNS` plus `Object.keys(PERMISSION_SCHEMA)`, so without an entry the noun does
  not exist and the permissions matrix import rejects any role granting it.
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
- **Bulk updates bypass instance validators.** Nothing writes facilities through
  `Facility.update({}, { where })` today. If that changes, the guard silently stops applying, so it
  is worth a comment at the validator saying so.
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

## Build steps

- [ ] Verify the empty-cell behaviour of the yup `Facility` cast, and settle whether
      `sensitiveNetworkId` is declared on the schema
- [ ] `SENSITIVE_NETWORK` in `OTHER_REFERENCE_TYPES`, `SensitiveNetwork` in `PERMISSION_SCHEMA`, and
      the type in `EXCLUDED_FROM_FULL_IMPORT_CHECK` — one commit, so `provision` never breaks
- [ ] `SensitiveNetwork` import schema in `baseSchemas.js`
- [ ] `sensitiveNetwork` in `dependencies.js`, with `facility` needing it
- [ ] Facility model validator refusing a change to `sensitiveNetworkId` on an existing record
- [ ] Importer tests: network sheet import, facility enrolment at creation, one-file network plus
      facilities
- [ ] Importer tests: each refusal case, including the soft-deleted facility and the unchanged
      re-import that must pass
- [ ] Model-level tests for the guard, and a test that the backfill migration is unaffected
- [ ] Export round-trip test
- [ ] `provision` with the default spreadsheet still succeeds
- [ ] Decide on the `validateTableRows` fallback once the real error message is visible
