import config from 'config';
import { sanitizeRecord } from './sanitizeRecord';
import { getModelOutgoingQueryOptions } from './getModelOutgoingQueryOptions';

const { readOnly } = config.sync;

const snapshotChangesForModel = async (model, fromSessionIndex, patientIds) => {
  const queryOptions = getModelOutgoingQueryOptions(model, fromSessionIndex, patientIds);
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

export const snapshotOutgoingChangesForFacility = async (models, fromSessionIndex, patientIds) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(model, fromSessionIndex, patientIds);
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
