import type {
  ChangelogRecord,
  SyncSnapshotAttributes,
  SyncSnapshotAttributesWithChangelog,
} from 'types/sync';

export const extractChangelogFromSnapshotRecords = (
  snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[],
): {
  snapshotRecords: SyncSnapshotAttributes[];
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
  }, [] as SyncSnapshotAttributes[]);

  return {
    snapshotRecords: processedRecords,
    changelogRecords,
  };
};
