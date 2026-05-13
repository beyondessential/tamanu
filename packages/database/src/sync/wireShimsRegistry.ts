import { registerWireShim } from './wireShims';

// Registers the shim chain for the current build. Run once at module import time.
// Each entry covers a single wire-schema bump.
//
// Adding a new shim:
//   - Pick the next available `versionFrom` (i.e. CURRENT_WIRE_SCHEMA - 1 at the time
//     of writing). One bump can ship multiple shim entries (one per affected record type).
//   - Use the combinators in wireShims.ts (`addField`, `removeField`, `renameField`)
//     for the common cases, or supply `upcast` / `downcast` directly.
//   - Bump CURRENT_WIRE_SCHEMA in packages/constants/src/sync.ts.
//
// Retiring an old shim: when raising MIN_SUPPORTED_WIRE_SCHEMA, any entries with
// `versionFrom` below the new floor can be removed.

// -----------------------------------------------------------------------------
// notes: note_type (TEXT) -> note_type_id (FK to reference_data)
//
// Covers migration 1759894448776-migrateNoteTypesToReferenceData (landed ~v2.41).
// Pre-migration facilities store the note type as a short code on the column itself
// (`note_type: "treatmentPlan"`). Post-migration central stores a FK id referencing
// reference_data entries with deterministic ids of the form `notetype-<code>`.
//
// The migration hardcoded 16 entries; the same table is reproduced here so the shim
// is self-contained and audit-friendly. Custom note types added in reference_data
// after the migration are downcast to the generic 'other' code (the same fallback
// the migration's own backfill used for unmappable values).
// -----------------------------------------------------------------------------

const NOTE_TYPE_CODE_TO_ID: Record<string, string> = {
  treatmentPlan: 'notetype-treatmentPlan',
  discharge: 'notetype-discharge',
  clinicalMobile: 'notetype-clinicalMobile',
  handover: 'notetype-handover',
  areaToBeImaged: 'notetype-areaToBeImaged',
  resultDescription: 'notetype-resultDescription',
  other: 'notetype-other',
  system: 'notetype-system',
  admission: 'notetype-admission',
  medical: 'notetype-medical',
  surgical: 'notetype-surgical',
  nursing: 'notetype-nursing',
  dietary: 'notetype-dietary',
  pharmacy: 'notetype-pharmacy',
  physiotherapy: 'notetype-physiotherapy',
  social: 'notetype-social',
};

const NOTE_TYPE_ID_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(NOTE_TYPE_CODE_TO_ID).map(([code, id]) => [id, code]),
);

// Hardcoded as literals (rather than `NOTE_TYPE_CODE_TO_ID[FALLBACK_CODE]`) so they
// type as `string` under `noUncheckedIndexedAccess` and can be used directly as
// index keys below. The two halves are kept in lock-step by the mapping above.
const FALLBACK_CODE = 'other';
const FALLBACK_ID = 'notetype-other';

registerWireShim({
  recordType: 'notes',
  versionFrom: 0,
  // Old facility pushes `{ noteType: 'treatmentPlan' }`; canonicalise to
  // `{ noteTypeId: 'notetype-treatmentPlan' }` matching the post-migration schema.
  // Records that already have a noteTypeId (e.g. re-pushes after a partial sync)
  // are left alone.
  upcast: record => {
    if ('noteTypeId' in record) return record;
    if (!('noteType' in record)) return record;
    const { noteType, ...rest } = record;
    const code = typeof noteType === 'string' ? noteType : FALLBACK_CODE;
    return {
      ...rest,
      noteTypeId: NOTE_TYPE_CODE_TO_ID[code] ?? FALLBACK_ID,
    };
  },
  // Central sends `{ noteTypeId: 'notetype-treatmentPlan' }`; rewrite to
  // `{ noteType: 'treatmentPlan' }` for facilities that still have the old TEXT
  // column. Custom (admin-created) note types fall back to 'other' since the old
  // facility has no way to render them and the column was an enum-shaped string.
  downcast: record => {
    if (!('noteTypeId' in record)) return record;
    const { noteTypeId, ...rest } = record;
    const id = typeof noteTypeId === 'string' ? noteTypeId : FALLBACK_ID;
    return {
      ...rest,
      noteType: NOTE_TYPE_ID_TO_CODE[id] ?? FALLBACK_CODE,
    };
  },
});
