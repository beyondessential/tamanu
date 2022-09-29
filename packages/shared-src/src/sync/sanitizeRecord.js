import { DataTypes } from 'sequelize';
import { toDateTimeString, toDateString } from '../utils/dateTime';

const COLUMNS_EXCLUDED_FROM_SYNC = ['createdAt', 'updatedAt', 'updatedAtSyncTick'];

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

export const sanitizeRecord = (model, record) =>
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
