import type { ChangelogRecord, SyncSnapshotAttributesWithChangelog } from './attachChangelogRecordsToSnapshot';

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
      const { changelogRecords: _, ...rest } = row;
      acc.push(rest);
    } else {
      acc.push(row);
    }
    return acc;
  }, [] as SyncSnapshotAttributesWithChangelog[]);

  return {
    snapshotRecords: processedRecords,
    changelogRecords
  };
};
