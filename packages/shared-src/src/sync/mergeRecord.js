import { snake } from 'case';

// utility that can pick the latest whole record, or single field, depending on what is passed in
const pickLatest = (existing, incoming, existingUpdateTick = 0, incomingUpdateTick = 0) => {
  const existingUpdateTickNumber =
    typeof existingUpdateTick === 'string' ? parseInt(existingUpdateTick) : existingUpdateTick;
  const incomingUpdateTickNumber =
    typeof incomingUpdateTick === 'string' ? parseInt(incomingUpdateTick) : incomingUpdateTick;

  if (incomingUpdateTickNumber > existingUpdateTickNumber) {
    return { latest: incoming, latestTick: incomingUpdateTickNumber };
  }
  return { latest: existing, latestTick: existingUpdateTickNumber };
};

// perform advanced conflict resolution, merging two versions of the record using the latest version
// of each field
const lastWriteWinsPerField = (existing, incoming) => {
  const merged = { ...existing, ...incoming }; // make sure it has all fields in both
  const mergedUpdatedAtByField = {};
  Object.keys(merged)
    .filter(key => !['updatedAtByField', 'updatedAtSyncTick'].includes(key))
    .forEach(key => {
      const { latest, latestTick } = pickLatest(
        existing[key],
        incoming[key],
        existing.updatedAtByField[snake(key)],
        incoming.updatedAtByField[snake(key)],
      );
      merged[key] = latest;
      mergedUpdatedAtByField[snake(key)] = latestTick;
    });
  merged.updatedAtByField = mergedUpdatedAtByField;
  // if either record had 'updatedAtSyncTick' set, the merged updatedAtSyncTick should be the
  // highest of the two
  if (existing.updatedAtSyncTick !== undefined || incoming.updatedAtSyncTick !== undefined) {
    merged.updatedAtSyncTick = Math.max(
      existing.updatedAtSyncTick || -1,
      incoming.updatedAtSyncTick || -1,
    );
  }
  return merged;
};

// merge two records, using either a field-by-field merge strategy (if updatedAtByField is defined)
// or by simply choosing the incoming record (if field specific information is not available)
export const mergeRecord = (existing, incoming) => {
  return existing.updatedAtByField && incoming.updatedAtByField
    ? lastWriteWinsPerField(existing, incoming)
    : incoming;
};
