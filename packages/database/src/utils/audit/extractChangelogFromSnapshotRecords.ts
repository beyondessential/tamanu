import type {
  ChangelogRecord,
  SyncSnapshotAttributesWithChangelog,
} from './attachChangelogToSnapshotRecords';

export const extractChangelogFromSnapshotRecords = (
  snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[],
): {
  snapshotRecords: SyncSnapshotAttributesWithChangelog[];
  changelogRecords: ChangelogRecord[];
} => {
  const changelogRecords: ChangelogRecord[] = [];
  const processedRecords = snapshotRecordsWithChangelog.reduce((acc, row) => {
    if (row.changelogRecords) {
      changelogRecords.push(...row.changelogRecords);
      delete row.changelogRecords;
    }
    acc.push(row);

    return acc;
  }, [] as SyncSnapshotAttributesWithChangelog[]);

  return {
    snapshotRecords: processedRecords,
    changelogRecords,
  };
};
