import type { ChangeLog } from 'models';
import type { SyncSnapshotAttributes, SyncSnapshotAttributesWithChangelog } from 'types/sync';

export const extractChangelogFromSnapshotRecords = (
  snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[],
): {
  snapshotRecords: SyncSnapshotAttributes[];
  changelogRecords: ChangeLog[];
} => {
  const changelogRecords: ChangeLog[] = [];
  const processedRecords: SyncSnapshotAttributes[] = [];

  for (const row of snapshotRecordsWithChangelog) {
    if (row.changelogRecords !== undefined) {
      for (const changelogRecord of row.changelogRecords) {
        changelogRecords.push(changelogRecord);
      }
      delete row.changelogRecords;
    }
    processedRecords.push(row);
  }

  return {
    snapshotRecords: processedRecords,
    changelogRecords,
  };
};
