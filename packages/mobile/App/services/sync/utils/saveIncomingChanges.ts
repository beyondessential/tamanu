import { groupBy, chunk } from 'lodash';

import { SyncRecord, PersistResult } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/helpers';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeInserts, executeUpdates, executeDeletes } from './executeCrud';
import { MODELS_MAP } from '../../../models/modelsMap';
import { BaseModel } from '../../../models/BaseModel';

/**
 * Save changes for a single model in batch because SQLite only support limited number of parameters
 * @param model
 * @param changes
 * @param progressCallback
 * @returns
 */
const saveChangesForModel = async (
  model: typeof BaseModel,
  changes: SyncRecord[],
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<PersistResult> => {
  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.data.id);
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  let idToUpdatedSinceSession = {};

  for (const batchOfIds of chunk(idsForUpsert, SQLITE_MAX_PARAMETERS)) {
    const batchOfExisting = await model.findByIds(batchOfIds, {
      select: ['id', 'updatedAtSyncIndex'],
    });
    const batchOfRecords = Object.fromEntries(
      batchOfExisting.map(e => [e.id, e.updatedAtSyncIndex]),
    );
    idToUpdatedSinceSession = { ...idToUpdatedSinceSession, ...batchOfRecords };
  }

  const recordsForCreate = changes
    .filter(c => !c.isDeleted && idToUpdatedSinceSession[c.data.id] === undefined)
    .map(({ data }) => buildFromSyncRecord(model, data));

  const recordsForUpdate = changes
    .filter(
      r => !r.isDeleted
      && !!idToUpdatedSinceSession[r.data.id]
      && r.data.updatedAtSyncIndex > idToUpdatedSinceSession[r.data.id],
    )
    .map(({ data }) => buildFromSyncRecord(model, data));

  // run each import process
  const { failures: createFailures } = await executeInserts(
    model,
    recordsForCreate,
    progressCallback,
  );
  const { failures: updateFailures } = await executeUpdates(
    model,
    recordsForUpdate,
    progressCallback,
  );
  const { failures: deleteFailures } = await executeDeletes(model, idsForDelete, progressCallback);

  // return combined failures
  return { failures: [...createFailures, ...updateFailures, ...deleteFailures] };
};

/**
 * Save all the incoming changes in the right order of dependency
 * @param models
 * @param changes
 * @param progressCallback
 * @returns
 */
export const saveIncomingChanges = async (
  models: typeof MODELS_MAP,
  changes: SyncRecord[],
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<PersistResult> => {
  const sortedModels = await sortInDependencyOrder(models);
  const changesByRecordType = groupBy(changes, c => c.recordType);
  const failures = [];

  for (const model of sortedModels) {
    const modelRecords = changesByRecordType[model.getPluralTableName()] || [];

    const { failures: modelFailures } = await saveChangesForModel(
      model,
      modelRecords,
      progressCallback,
    );

    failures.push(...modelFailures);
  }

  return { failures };
};
