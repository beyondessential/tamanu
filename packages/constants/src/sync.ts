export const SYNC_DIRECTIONS = {
  DO_NOT_SYNC: 'do_not_sync', // Important! Non-syncing tables should also be added to shared/src/services/migrations/constants.js
  PUSH_TO_CENTRAL: 'push_to_central',
  PUSH_TO_CENTRAL_THEN_DELETE: 'push_to_central_then_delete', // No local copy required after sync
  PULL_FROM_CENTRAL: 'pull_from_central',
  BIDIRECTIONAL: 'bidirectional',
};

export const SYNC_DIRECTIONS_VALUES = Object.values(SYNC_DIRECTIONS);

// A facility's first sync runs in phases, so each capability of the server becomes available as soon
// as the data it needs has arrived. The values are ordered, and compared as such.
export const SYNC_PHASES = {
  // enough to authenticate a user and start serving requests
  BOOT: 1,
  // the rest of the data that isn't scoped to a patient, plus the patient records themselves
  CATALOGUE: 2,
  // data recorded against a patient or an encounter
  RECORDS: 3,
};

export const SYNC_PHASES_VALUES = Object.values(SYNC_PHASES);

export const SYNC_PHASE_LABELS = {
  [SYNC_PHASES.BOOT]: 'boot',
  [SYNC_PHASES.CATALOGUE]: 'catalogue',
  [SYNC_PHASES.RECORDS]: 'records',
};

// the phases in the order they run, as the labels they're reported by rather than their numbers
export const SYNC_PHASE_SEQUENCE = [...SYNC_PHASES_VALUES]
  .sort((a, b) => a - b)
  .map(phase => SYNC_PHASE_LABELS[phase]);

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
