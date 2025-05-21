import type { ChangeLog } from 'models';
import type {
  SyncSnapshotAttributes,
  SyncSnapshotAttributesWithChangelog,
} from 'types/sync';

export const extractChangelogFromSnapshotRecords = (
  snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[],
): {
  snapshotRecords: SyncSnapshotAttributes[];
  changelogRecords: ChangeLog[];
} => {
  const changelogRecords: ChangeLog[] = [];
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
