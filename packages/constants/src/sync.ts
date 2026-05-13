export const SYNC_DIRECTIONS = {
  DO_NOT_SYNC: 'do_not_sync', // Important! Non-syncing tables should also be added to shared/src/services/migrations/constants.js
  PUSH_TO_CENTRAL: 'push_to_central',
  PUSH_TO_CENTRAL_THEN_DELETE: 'push_to_central_then_delete', // No local copy required after sync
  PULL_FROM_CENTRAL: 'pull_from_central',
  BIDIRECTIONAL: 'bidirectional',
};

export const SYNC_DIRECTIONS_VALUES = Object.values(SYNC_DIRECTIONS);

// 16-bit uint
//
// When adding message kinds here, also add them to the Wireshark dissector at:
// /docs/wireshark-tamanu-stream.lua
const NEVER_USE_ZERO = Symbol('zero');
export const SYNC_STREAM_MESSAGE_KIND = {
  // This should never be used, so we make it impossible to
  [NEVER_USE_ZERO]: 0x0000,

  // Control messages start with 0xf
  END: 0xf001,

  // Application messages start with 0x0
  SESSION_WAITING: 0x0001,
  PULL_WAITING: 0x0002,
  PULL_CHANGE: 0x0003,
};

// Wire-schema version: a monotonically incrementing integer that's bumped only when a
// sync-impacting migration lands (one that changes the JSON shape of a synced record).
//
// CURRENT is what this build emits and accepts as canonical. MIN_SUPPORTED is the
// oldest wire-schema version this build's shim registry can upcast/downcast through.
// When the central server has `sync.allowVersionSkew` enabled, an incoming sync
// session can declare any version in [MIN_SUPPORTED_WIRE_SCHEMA, CURRENT_WIRE_SCHEMA].
//
// To bump: add a new shim file under packages/database/src/sync/wireShims, then
// raise CURRENT_WIRE_SCHEMA by one. MIN_SUPPORTED_WIRE_SCHEMA moves up only when
// dropping support for an older version (which retires its shims from the registry).
//
// PoC floor: version 0 represents the wire-shape as it stood before the
// migrateNoteTypesToReferenceData migration (which converted notes.note_type from a
// TEXT enum-code to notes.note_type_id pointing at reference_data entries with
// deterministic ids like `notetype-<code>`). Version 1 is the current shape.
// The shim between them lives in packages/database/src/sync/wireShimsRegistry.ts.
// Future wire-impacting migrations bump CURRENT_WIRE_SCHEMA and add a new shim entry;
// the floor moves up only when retiring support for an older facility version.
export const CURRENT_WIRE_SCHEMA = 1;
export const MIN_SUPPORTED_WIRE_SCHEMA = 0;
