import { DATE } from 'sequelize';

const COLUMNS_EXCLUDED_FROM_SYNC = ['createdAt', 'updatedAt', 'markedForSync'];

export const sanitizeRecord = (model, record) =>
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
