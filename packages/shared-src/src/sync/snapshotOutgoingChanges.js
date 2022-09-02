import config from 'config';
import { Op, DataTypes } from 'sequelize';
import { toDateTimeString, toDateString } from '../utils/dateTime';

const { readOnly } = config.sync;

const COLUMNS_EXCLUDED_FROM_SYNC = ['createdAt', 'updatedAt', 'markedForSync'];

const formatValue = (columnType, value) => {
  if (columnType instanceof DataTypes.DATE) {
    return value?.toISOString();
  }
  if (columnType instanceof DataTypes.DATETIMESTRING) {
    return toDateTimeString(value) ?? undefined;
  }
  if (columnType instanceof DataTypes.DATESTRING) {
    return toDateString(value) ?? undefined;
  }
  return value;
};

const snapshotChangesForModel = async (model, fromSessionIndex, patientIds, facilitySettings) => {
  const shouldFilterByPatient = !!model.buildSyncFilter && patientIds;
  if (shouldFilterByPatient && patientIds.length === 0) {
    return [];
  }

  const patientFilter =
    shouldFilterByPatient && model.buildSyncFilter(patientIds, facilitySettings);

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
          const value = formatValue(columnType, record[name]);
          return [name, value];
        }),
    );

  return recordsChanged.map(r => ({
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    data: sanitizeRecord(r),
  }));
};

export const snapshotOutgoingChanges = async (
  models,
  fromSessionIndex,
  patientIds,
  facilitySettings,
) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(
      model,
      fromSessionIndex,
      patientIds,
      facilitySettings,
    );
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
