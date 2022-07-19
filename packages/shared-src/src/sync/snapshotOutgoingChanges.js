import config from 'config';
import { Op, DATE } from 'sequelize';

const { readOnly } = config.sync;

const COLUMNS_EXCLUDED_FROM_SYNC = ['createdAt', 'updatedAt', 'markedForSync'];

const snapshotChangesForModel = async (model, fromSessionIndex, patientIds) => {
  const shouldFilterByPatient = !!model.buildPatientFilter && patientIds;
  if (shouldFilterByPatient && patientIds.length === 0) {
    return [];
  }
  const patientFilter = shouldFilterByPatient && model.buildPatientFilter(patientIds);

  const baseFilter = {
    where: { updatedAtSyncIndex: { [Op.gte]: fromSessionIndex } },
  };

  const recordsChanged = await model.findAll(
    patientFilter
      ? {
          ...patientFilter,
          where: { ...baseFilter.where, ...patientFilter.where },
        }
      : baseFilter,
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

export const snapshotOutgoingChanges = async (models, fromSessionIndex, patientIds) => {
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
