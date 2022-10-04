import { snake } from 'case';

// utility that can pick the latest whole record, or single field, depending on what is passed in
const pickLatest = (existing, incoming, existingUpdateTick = 0, incomingUpdateTick = 0) => {
  if (incomingUpdateTick > existingUpdateTick) {
    return { latest: incoming, latestTick: incomingUpdateTick };
  }
  return { latest: existing, latestTick: existingUpdateTick };
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
  // overall updatedAtSyncTick should be the highest of the two
  merged.updatedAtSyncTick = Math.max(
    existing.updatedAtSyncTick || 0,
    incoming.updatedAtSyncTick || 0,
  );
  return merged;
};

// merge two records, using either a field-by-field merge strategy (if updatedAtByField is defined)
// or by simply choosing the incoming record (if field specific information is not available)
export const mergeRecord = (existing, incoming) => {
  return existing.updatedAtByField && incoming.updatedAtByField
    ? lastWriteWinsPerField(existing, incoming)
    : incoming;
};
