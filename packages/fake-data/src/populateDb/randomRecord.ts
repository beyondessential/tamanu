import { type Models } from '@tamanu/database';

import { chance } from '../fake/index.js';
import { REFERENCE_DATA_NAMES } from '../fake/names.js';
import { POOL_SIZE } from './pool.js';
import { createReferenceData } from './helpers/referenceData.js';

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
const referenceDataCache = new Map<string, Array<{ id: string; name: string }>>();
const referenceDataQueue = new Map<string, Promise<unknown>>();

export const resetRandomRecordCache = (): void => {
  idCache.clear();
  referenceDataCache.clear();
  referenceDataQueue.clear();
};

export const randomRecordId = async (models: Models, modelName: string): Promise<string | null> => {
  let ids = idCache.get(modelName);
  if (!ids) {
    const model = (models as Record<string, any>)[modelName];
    // Records picked at random are current care, so a deceased patient is never the subject.
    const where = modelName === 'Patient' ? { dateOfDeath: null } : undefined;
    const rows = await model.findAll({ where, attributes: ['id'], raw: true });
    ids = rows.map((row: { id: string }) => row.id);
    // Don't cache an empty pool: the table may gain rows later this round.
    if (ids.length > 0) idCache.set(modelName, ids);
  }
  return ids.length > 0 ? chance.pickone(ids) : null;
};

// Reference data is typed, and a column that references it expects one type: a
// prescription's medication is a drug, a diagnosis a diagnosis. The pool grows to one row per
// name (at most a pool's worth), so rounds that skip the import step still spread their picks.
// Calls for one type run one at a time: helpers run concurrently, and parallel growth would
// mint duplicate names from the same stale pool.
export const randomReferenceDataId = (models: Models, type: string): Promise<string> => {
  const next = (referenceDataQueue.get(type) ?? Promise.resolve()).then(() =>
    pickOrGrowReferenceData(models, type),
  );
  referenceDataQueue.set(
    type,
    next.catch(() => undefined),
  );
  return next;
};

const pickOrGrowReferenceData = async (models: Models, type: string): Promise<string> => {
  let rows = referenceDataCache.get(type);
  if (!rows) {
    rows = (await models.ReferenceData.findAll({
      where: { type },
      attributes: ['id', 'name'],
      raw: true,
      limit: POOL_SIZE,
    })) as unknown as Array<{ id: string; name: string }>;
    referenceDataCache.set(type, rows);
  }
  const names = REFERENCE_DATA_NAMES[type];
  if (rows.length < Math.min(names?.length ?? POOL_SIZE, POOL_SIZE)) {
    const takenNames = new Set(rows.map(({ name }) => name));
    const unusedNames = names?.filter(name => !takenNames.has(name));
    const created = await createReferenceData(
      models,
      type,
      unusedNames?.length ? chance.pickone(unusedNames) : undefined,
    );
    rows.push({ id: created.id, name: created.name });
    return created.id;
  }
  return chance.pickone(rows).id;
};
