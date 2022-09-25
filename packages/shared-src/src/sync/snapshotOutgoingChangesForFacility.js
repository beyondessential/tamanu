import config from 'config';
import { sanitizeRecord } from './sanitizeRecord';
import { getModelOutgoingQueryOptions } from './getModelOutgoingQueryOptions';
import { SYNC_SESSION_DIRECTION } from './constants';
import { log } from 'shared/services/logging/log';

const { readOnly } = config.sync;

const snapshotChangesForModel = async (model, sessionId, since, patientIds) => {
  const queryOptions = getModelOutgoingQueryOptions(model, patientIds, since);
  if (!queryOptions) {
    return [];
  }

  const recordsChanged = await model.findAll(queryOptions);

  log.debug(
    `snapshotChangesForModel: Found ${recordsChanged.length} for model ${model.tableName} since ${since}`,
  );

  return recordsChanged.map(r => ({
    sessionId,
    direction: SYNC_SESSION_DIRECTION.OUTGOING,
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    recordId: r.id,
    data: sanitizeRecord(model, r),
  }));
};

export const snapshotOutgoingChangesForFacility = async (models, sessionId, since, patientIds) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(model, sessionId, since, patientIds);
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
