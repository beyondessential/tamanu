import config from 'config';
import { getModelOutgoingQueryOptions } from './getModelOutgoingQueryOptions';
import { sanitizeRecord } from './sanitizeRecord';
import { SYNC_SESSION_DIRECTION } from './constants';
import { log } from 'shared/services/logging/log';

const { readOnly, persistedCacheBatchSize } = config.sync;

const snapshotChangesForModel = async (
  model,
  models,
  since,
  patientIds,
  sessionId,
  facilitySettings,
) => {
  const queryOptions = getModelOutgoingQueryOptions(model, patientIds, since, facilitySettings);

  if (!queryOptions) {
    return 0;
  }

  const recordsChangedCount = await model.count(queryOptions);
  const batchCount = Math.ceil(recordsChangedCount / persistedCacheBatchSize);

  for (let batchNumber = 0; batchNumber < batchCount; batchNumber++) {
    const recordsChanged = await model.findAll({
      ...queryOptions,
      order: [['id', 'ASC']],
      offset: batchNumber * persistedCacheBatchSize,
      limit: persistedCacheBatchSize,
    });
    const sanitizedRecords = recordsChanged.map(r => ({
      sessionId,
      direction: SYNC_SESSION_DIRECTION.OUTGOING,
      isDeleted: !!r.deletedAt,
      recordType: model.tableName,
      recordId: r.id,
      data: sanitizeRecord(model, r),
    }));

    await models.SyncSessionRecord.bulkCreate(sanitizedRecords);
  }

  log.debug(
    `snapshotChangesForModel: Found ${recordsChangedCount} for model ${model.tableName} since ${since}, in session ${sessionId}`,
  );

  return recordsChangedCount;
};

export const snapshotOutgoingChangesForCentral = async (
  outgoingModels,
  models,
  since,
  patientIds,
  sessionId,
  facilitySettings,
) => {
  if (readOnly) {
    return [];
  }

  let changesCount = 0;

  for (const model of Object.values(outgoingModels)) {
    const modelChangesCount = await snapshotChangesForModel(
      model,
      models,
      since,
      patientIds,
      sessionId,
      facilitySettings,
    );

    changesCount += modelChangesCount || 0;
  }

  log.debug(
    `snapshotChangesForModel: Found a total of ${changesCount} for all models since ${since}, in session ${sessionId}`,
  );

  return changesCount;
};
