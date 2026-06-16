import { type Models } from '@tamanu/database';

import { chance } from '../fake/index.ts';

// Per-round cache of record ids, keyed by model name.
//
// The shared `randomRecordId` in @tamanu/database/demoData/utilities uses
// `ORDER BY RANDOM()`, which full-scans the table on every call. That's fine for
// small demo data, but the high-volume tally seed calls it many times per round
// against tables that grow each round. Here we load each model's ids once per
// round and pick in memory (O(1) per call), keeping the uniform-random variety
// without the per-call scan. resetRandomRecordCache() clears it between rounds
// so later rounds pick up rows added by earlier ones, and memory stays bounded.
const idCache = new Map<string, string[]>();

export const resetRandomRecordCache = (): void => {
  idCache.clear();
};

export const randomRecordId = async (models: Models, modelName: string): Promise<string | null> => {
  let ids = idCache.get(modelName);
  if (!ids) {
    const model = (models as Record<string, any>)[modelName];
    const rows = await model.findAll({ attributes: ['id'], raw: true });
    ids = rows.map((row: { id: string }) => row.id);
    // Don't cache an empty pool: the table may gain rows later this round.
    if (ids.length > 0) idCache.set(modelName, ids);
  }
  return ids.length > 0 ? chance.pickone(ids) : null;
};
