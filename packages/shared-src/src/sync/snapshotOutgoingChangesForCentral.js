import config from 'config';
import { getModelOutgoingQueryOptions } from './getModelOutgoingQueryOptions';
import { sanitizeRecord } from './sanitizeRecord';
import { SESSION_SYNC_DIRECTION } from './constants';

const { readOnly, queryBatchSize } = config.sync;

const snapshotChangesForModel = async (
  model,
  models,
  fromSessionIndex,
  patientIds,
  sessionIndex,
) => {
  const queryOptions = getModelOutgoingQueryOptions(model, patientIds, fromSessionIndex);

  if (!queryOptions) {
    return 0;
  }

  const recordsChangedCount = await model.count(queryOptions);
  const batchCount = Math.ceil(recordsChangedCount / queryBatchSize);

  for (let batchNumber = 0; batchNumber < batchCount; batchNumber++) {
    const recordsChanged = await model.findAll({
      ...queryOptions,
      order: [['id', 'ASC']],
      offset: batchNumber * queryBatchSize,
      limit: queryBatchSize,
    });
    const sanitizedRecords = recordsChanged.map(r => ({
      sessionIndex,
      direction: SESSION_SYNC_DIRECTION.OUTGOING,
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
  fromSessionIndex,
  patientIds,
  sessionIndex,
) => {
  if (readOnly) {
    return [];
  }

  let changesCount = 0;

  for (const model of Object.values(outgoingModels)) {
    const modelChangesCount = await snapshotChangesForModel(
      model,
      models,
      fromSessionIndex,
      patientIds,
      sessionIndex,
    );

    changesCount += modelChangesCount || 0;
  }

  return changesCount;
};
