import { chunk } from 'lodash';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { SQLITE_MAX_PARAMETERS } from '~/infra/db/helpers';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeInserts, executeUpdates, executeDeletes } from './executeCrud';
import { MODELS_MAP } from '~/models/modelsMap';
import { BaseModel } from '~/models/BaseModel';
import { QUERY_BATCH_SIZE } from '../constants';

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
): Promise<void> => {
  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.dataJson.id);
  const idsForUpsert = changes
    .filter(c => !c.isDeleted && c.dataJson.id)
    .map(c => c.dataJson.id);
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
    .filter(c => !c.isDeleted && idToUpdatedSinceSession[c.recordId] === undefined)
    .map(({ dataJson }) => buildFromSyncRecord(model, dataJson));

  const recordsForUpdate = changes
    .filter(
      c =>
        !c.isDeleted &&
        !!idToUpdatedSinceSession[c.recordId] &&
        c.dataJson.updatedAtSyncIndex > idToUpdatedSinceSession[c.recordId],
    )
    .map(({ dataJson }) => {
      return buildFromSyncRecord(model, dataJson);
    });

  // run each import process
  await executeInserts(model, recordsForCreate, progressCallback);
  await executeUpdates(model, recordsForUpdate, progressCallback);
  await executeDeletes(model, idsForDelete, progressCallback);
};

/**
 * Persist the incoming changes that are previously stored in session_sync_record into actual tables.
 * This will be done in batches to avoid memory problem
 * @param model 
 * @param models 
 * @param progressCallback 
 */
const saveChangesForModelInBatches = async (
  model: typeof BaseModel,
  models: typeof MODELS_MAP,
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  const syncRecordsCount = await models.SessionSyncRecord.count({
    recordType: model.getPluralTableName(),
  });

  const batchCount = Math.ceil(syncRecordsCount / QUERY_BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const modelRecordsInBatch = await models.SessionSyncRecord.find({
      where: { recordType: model.getPluralTableName() },
      order: { id: 'ASC' },
      take: QUERY_BATCH_SIZE,
      skip: QUERY_BATCH_SIZE * batchIndex,
    });

    await saveChangesForModel(
      model,
      modelRecordsInBatch,
      progressCallback,
    );
  }
};

/**
 * Save all the incoming changes in the right order of dependency, 
 * using the data stored in session_sync_record previously
 * @param models
 * @param changes
 * @param progressCallback
 * @returns
 */
export const saveIncomingChanges = async (
  models: typeof MODELS_MAP,
  incomingModels: typeof MODELS_MAP,
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  const sortedModels = await sortInDependencyOrder(incomingModels);

  for (const model of sortedModels) {
    await saveChangesForModelInBatches(
      model,
      models,
      progressCallback,
    );
  }
};
