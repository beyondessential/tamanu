import { addField, registerWireShim } from './wireShims';

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

// Example covering the addExtraDataFieldToPatientDeathData migration (1770952177082).
// versionFrom = 0 represents the wire shape before extra_data existed on
// patient_death_data; versionFrom + 1 = 1 represents the current shape.
//
// - downcast: drop `extraData` so an older facility doesn't receive a key it can't store.
// - upcast: fill `extraData: null` (the column is nullable on central) so the receiving
//   side sees an explicit key matching the canonical shape.
registerWireShim({
  recordType: 'patient_death_data',
  versionFrom: 0,
  ...addField('extraData', null),
});
