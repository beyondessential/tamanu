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

const snapshotChangesForModel = async (model, fromSessionIndex) => {
  const recordsChanged = await model.findAll({
    where: { updatedAtSyncIndex: { [Op.gte]: fromSessionIndex } },
  });

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

export const snapshotOutgoingChanges = async (models, fromSessionIndex) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(model, fromSessionIndex);
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
