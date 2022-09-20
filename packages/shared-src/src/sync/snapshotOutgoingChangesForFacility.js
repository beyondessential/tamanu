import config from 'config';
import { sanitizeRecord } from './sanitizeRecord';
import { getModelOutgoingQueryOptions } from './getModelOutgoingQueryOptions';

const { readOnly } = config.sync;

const snapshotChangesForModel = async (model, since, patientIds) => {
  const queryOptions = getModelOutgoingQueryOptions(model, since, patientIds);
  if (!queryOptions) {
    return [];
  }

  const recordsChanged = await model.findAll(queryOptions);

  return recordsChanged.map(r => ({
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    data: sanitizeRecord(r),
  }));
};

export const snapshotOutgoingChangesForFacility = async (models, since, patientIds) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(model, since, patientIds);
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
