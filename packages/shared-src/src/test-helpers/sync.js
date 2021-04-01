export const expectDeepSyncRecordMatch = (dbRecord, syncRecord) => {
  const { updatedAt, createdAt, deletedAt, markedForSync, password, ...syncableData } = dbRecord;
  Object.keys(syncableData).forEach(field => {
    if (Array.isArray(dbRecord[field])) {
      // iterate over relation fields
      expect(syncRecord.data).toHaveProperty(`${field}.length`);
      dbRecord[field].forEach(childDbRecord => {
        const childSyncRecord = syncRecord.data[field].find(r => r.data.id === childDbRecord.id);
        expect(childSyncRecord).toBeDefined();
        expectDeepSyncRecordMatch(childDbRecord, childSyncRecord);
      });
    } else if (dbRecord[field] instanceof Date) {
      expect(syncRecord.data).toHaveProperty(field, dbRecord[field].toISOString());
    } else {
      expect(syncRecord.data).toHaveProperty(field, dbRecord[field]);
    }
  });
};

export const expectDeepSyncRecordsMatch = (dbRecords, syncRecords) =>
  dbRecords.forEach((r, i) => expectDeepSyncRecordMatch(r, syncRecords[i]));
