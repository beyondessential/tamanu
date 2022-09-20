import config from 'config';
import { getModelOutgoingQueryOptions } from './getModelOutgoingQueryOptions';
import { sanitizeRecord } from './sanitizeRecord';
import { SYNC_SESSION_DIRECTION } from './constants';

const { readOnly, persistedCacheBatchSize } = config.sync;

const snapshotChangesForModel = async (
  model,
  models,
  since,
  patientIds,
  sessionId,
) => {
  const queryOptions = getModelOutgoingQueryOptions(model, patientIds, since);

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

    await models.SessionSyncRecord.bulkCreate(sanitizedRecords);
  }

  return recordsChangedCount;
};

export const snapshotOutgoingChangesForCentral = async (
  outgoingModels,
  models,
  since,
  patientIds,
  sessionId,
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
    );

    changesCount += modelChangesCount || 0;
  }

  return changesCount;
};
