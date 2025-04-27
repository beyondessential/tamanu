export const attachChangelogRecordsToSnapshot = (
  snapshotRecords: any[],
  changelogRecords: any[],
) => {
  const changelogRecordsByRecordId = changelogRecords.reduce((acc, changelogRecord) => {
    (acc[changelogRecord.record_id] = acc[changelogRecord.record_id] || []).push(changelogRecord);
    return acc;
  }, {});

  snapshotRecords.forEach(
    (snapshotRecord) =>
      (snapshotRecord.changelogRecords = changelogRecordsByRecordId[snapshotRecord.recordId] || []),
  );
  return snapshotRecords;
};
