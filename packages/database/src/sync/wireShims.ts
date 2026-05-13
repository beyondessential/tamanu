import { CURRENT_WIRE_SCHEMA, MIN_SUPPORTED_WIRE_SCHEMA } from '@tamanu/constants';

// A WireShim translates a single record's JSON payload between two adjacent
// wire-schema versions. Each shim covers exactly one bump: `versionFrom -> versionFrom + 1`.
// The registry holds shims keyed by (recordType, versionFrom) and `applyChain` walks
// the chain in either direction.
//
// `downcast(record)` converts a record at version `versionFrom + 1` back to `versionFrom`,
// e.g. dropping a field that didn't exist in the older version.
//
// `upcast(record)` converts a record at version `versionFrom` forward to `versionFrom + 1`,
// e.g. filling a newly-required field with a default that's safe to assume for
// records that originated before the field existed.
//
// Both functions are pure. They take a plain JSON object (matching the JSON column
// names produced by snapshotOutgoingChanges) and return a plain JSON object.
export interface WireShim {
  recordType: string;
  versionFrom: number;
  downcast?: (record: Record<string, unknown>) => Record<string, unknown>;
  upcast?: (record: Record<string, unknown>) => Record<string, unknown>;
}

export type Direction = 'upcast' | 'downcast';

const shims: WireShim[] = [];

export function registerWireShim(shim: WireShim): void {
  if (shim.versionFrom < MIN_SUPPORTED_WIRE_SCHEMA || shim.versionFrom >= CURRENT_WIRE_SCHEMA) {
    throw new Error(
      `WireShim versionFrom=${shim.versionFrom} for ${shim.recordType} is outside the supported window [${MIN_SUPPORTED_WIRE_SCHEMA}, ${CURRENT_WIRE_SCHEMA - 1}]`,
    );
  }
  shims.push(shim);
}

export function getRegisteredShims(): readonly WireShim[] {
  return shims;
}

export function clearRegisteredShimsForTesting(): void {
  shims.length = 0;
}

// Walk the shim chain to translate a record from `fromVersion` to `toVersion`.
// Direction is implied by the relationship between the two versions:
//   fromVersion < toVersion -> upcast  (e.g. record arriving from old facility)
//   fromVersion > toVersion -> downcast (e.g. record being sent to old facility)
//   fromVersion === toVersion -> no-op
export function applyChain(
  recordType: string,
  record: Record<string, unknown>,
  fromVersion: number,
  toVersion: number,
): Record<string, unknown> {
  if (fromVersion === toVersion) return record;

  let current = record;
  if (fromVersion < toVersion) {
    for (let v = fromVersion; v < toVersion; v++) {
      const shim = shims.find(s => s.recordType === recordType && s.versionFrom === v);
      if (shim?.upcast) current = shim.upcast(current);
    }
  } else {
    for (let v = fromVersion - 1; v >= toVersion; v--) {
      const shim = shims.find(s => s.recordType === recordType && s.versionFrom === v);
      if (shim?.downcast) current = shim.downcast(current);
    }
  }
  return current;
}

// Helper combinators for common shim shapes. Each returns a partial WireShim that the
// caller composes with `recordType` and `versionFrom`.

// Field was added at version `versionFrom + 1`. Downcasting drops it; upcasting fills
// the supplied default.
export function addField(
  field: string,
  defaultValue: unknown,
): Pick<WireShim, 'downcast' | 'upcast'> {
  return {
    downcast: record => {
      const { [field]: _omit, ...rest } = record;
      return rest;
    },
    upcast: record => (field in record ? record : { ...record, [field]: defaultValue }),
  };
}

// Field was removed at version `versionFrom + 1`. Upcasting drops it; downcasting fills
// with the supplied default so older clients still see the field.
export function removeField(
  field: string,
  defaultValue: unknown,
): Pick<WireShim, 'downcast' | 'upcast'> {
  return {
    downcast: record => (field in record ? record : { ...record, [field]: defaultValue }),
    upcast: record => {
      const { [field]: _omit, ...rest } = record;
      return rest;
    },
  };
}

// Field was renamed from `oldName` to `newName` at version `versionFrom + 1`.
export function renameField(
  oldName: string,
  newName: string,
): Pick<WireShim, 'downcast' | 'upcast'> {
  return {
    downcast: record => {
      if (!(newName in record)) return record;
      const { [newName]: value, ...rest } = record;
      return { ...rest, [oldName]: value };
    },
    upcast: record => {
      if (!(oldName in record)) return record;
      const { [oldName]: value, ...rest } = record;
      return { ...rest, [newName]: value };
    },
  };
}
