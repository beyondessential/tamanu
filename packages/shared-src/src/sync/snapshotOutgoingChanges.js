import config from 'config';
import { Op, DATE } from 'sequelize';

const { readOnly } = config.sync;

const COLUMNS_EXCLUDED_FROM_SYNC = ['createdAt', 'updatedAt', 'markedForSync'];

const snapshotChangesForModel = async (model, sinceSessionIndex, patientIds) => {
  const where = {
    updatedSinceSession: { [Op.gte]: sinceSessionIndex }, // updatedSinceSession is set on all creates, updates, and soft deletes
  };
  const patientFilter =
    patientIds && model.buildPatientFilter && model.buildPatientFilter(patientIds);
  const recordsChanged = await model.findAll(
    patientFilter
      ? {
          ...patientFilter,
          where: { ...where, ...patientFilter.where },
        }
      : { where },
  );

  const sanitizeRecord = record =>
    Object.fromEntries(
      Object.keys(model.tableAttributes)
        // don't sync metadata columns like updatedAt
        .filter(c => !COLUMNS_EXCLUDED_FROM_SYNC.includes(c))
        // sanitize values, e.g. dates to iso strings
        .map(name => {
          const columnType = model.tableAttributes[name].type;
          const value = columnType instanceof DATE ? record[name]?.toISOString() : record[name];
          return [name, value];
        }),
    );

  return recordsChanged.map(r => ({
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    data: sanitizeRecord(r),
  }));
};

export const snapshotOutgoingChanges = async (models, sinceSessionIndex, patientIds) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(model, sinceSessionIndex, patientIds);
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
