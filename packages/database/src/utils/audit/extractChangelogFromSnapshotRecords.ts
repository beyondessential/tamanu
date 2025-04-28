import type { ChangelogRecord, SyncSnapshotAttributesWithChangelog } from './attachChangelogRecordsToSnapshot';

export const extractChangelogFromSnapshotRecords = (
  snapshotRecords: SyncSnapshotAttributesWithChangelog[],
): {
  snapshotRecords: SyncSnapshotAttributesWithChangelog[];
  changelogRecords: ChangelogRecord[];
} => {
  const changelogRecords = [];
  for (const row of snapshotRecords) {
    if (row.changelogRecords) {
      changelogRecords.push(...row.changelogRecords);
    }
    delete row.changelogRecords;
  }
  return { snapshotRecords, changelogRecords };
};
