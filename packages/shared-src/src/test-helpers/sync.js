import { QueryTypes } from 'sequelize';

export const expectDeepSyncRecordMatch = (dbRecord, syncRecord, options = {}) => {
  const {
    updatedAt: _updatedAt,
    createdAt: _createdAt,
    deletedAt: _deletedAt,
    updatedAtSyncTick: _updatedAtSyncTick,
    password: _password,
    ...syncableData
  } = dbRecord;

  const { nullableDateFields = [] } = options;

  Object.keys(syncableData).forEach(field => {
    if (Array.isArray(dbRecord[field])) {
      // iterate over relation fields
      expect(syncRecord.data).toHaveProperty(`${field}.length`);
      dbRecord[field].forEach(childDbRecord => {
        const childSyncRecord = syncRecord.data[field].find(r => r.data.id === childDbRecord.id);
        expect(childSyncRecord).toBeDefined();
        expectDeepSyncRecordMatch(childDbRecord, childSyncRecord, options);
      });
    } else if (dbRecord[field] instanceof Date) {
      expect(syncRecord.data).toHaveProperty(field, dbRecord[field].toISOString());
    } else if (nullableDateFields.includes(field)) {
      expect(syncRecord.data[field]).toBeNull();
    } else {
      expect(syncRecord.data).toHaveProperty(field, dbRecord[field]);
    }
  });
};

export const expectDeepSyncRecordsMatch = (dbRecords, syncRecords, options = {}) =>
  dbRecords.forEach((r, i) => expectDeepSyncRecordMatch(r, syncRecords[i], options));

// https://github.com/sequelize/sequelize/issues/3759#issuecomment-524036513
// THIS IS NOT SAFE! It interpolates a table name directly. Do not use it outside tests.
export async function unsafeSetUpdatedAt(sequelize, { table, ...replacements }) {
  return sequelize.query(`UPDATE ${table} SET updated_at = :updated_at WHERE id = :id`, {
    type: QueryTypes.UPDATE,
    replacements,
  });
}
