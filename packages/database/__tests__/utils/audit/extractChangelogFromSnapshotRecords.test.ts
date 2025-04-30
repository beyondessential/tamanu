import { describe, expect, it } from 'vitest';

import { extractChangelogFromSnapshotRecords } from '../../../src/utils/audit/extractChangelogFromSnapshotRecords';
import type { SyncSnapshotAttributesWithChangelog, ChangelogRecord } from '../../../src/types/sync';

describe('extractChangelogFromSnapshotRecords', () => {
  it('should extract changelog records from snapshot records', () => {
    // Arrange
    const changelogRecords: ChangelogRecord[] = [
      {
        record_id: 'record1',
        id: 'dogman-1',
        table_oid: 1234,
        table_schema: 'public',
        table_name: 'test',
        logged_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        updated_at_sync_tick: 100,
        updated_by_user_id: 'test-user',
        record_update: true,
        record_data: { test: 'data' },
      },
      {
        record_id: 'record1',
        id: 'dogman-2',
        table_oid: 1234,
        table_schema: 'public',
        table_name: 'test',
        logged_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        updated_at_sync_tick: 101,
        updated_by_user_id: 'test-user',
        record_update: true,
        record_data: { test: 'updated data' },
      },
    ];

    const snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[] = [
      {
        id: 1,
        changelogRecords: changelogRecords,
        direction: 'up',
        recordType: 'test',
        recordId: 'record1',
        isDeleted: false,
        data: {
          id: 1,
        },
        savedAtSyncTick: 0,
        updatedAtByFieldSum: 0,
        syncLookupId: 0,
        requiresRepull: false,
      },
      {
        id: 2,
        direction: 'up',
        recordType: 'test',
        recordId: 'record2',
        isDeleted: false,
        data: {
          id: 2,
        },
        savedAtSyncTick: 0,
        updatedAtByFieldSum: 0,
        syncLookupId: 0,
        requiresRepull: false,
      },
    ];

    // Act
    const result = extractChangelogFromSnapshotRecords(snapshotRecordsWithChangelog);

    // Assert
    expect(result.changelogRecords).toHaveLength(2);
    expect(result.snapshotRecords).toHaveLength(2);

    // Original changelog records should be in the result
    expect(result.changelogRecords).toEqual(changelogRecords);

    // Snapshot records should have changelog records removed
    expect(result.snapshotRecords[0].changelogRecords).toBeUndefined();
    expect(result.snapshotRecords[1].changelogRecords).toBeUndefined();

    // Original attributes should remain
    expect(result.snapshotRecords[0].recordId).toBe('record1');
    expect(result.snapshotRecords[0].data.id).toBe(1);
    expect(result.snapshotRecords[1].recordId).toBe('record2');
    expect(result.snapshotRecords[1].data.id).toBe(2);
  });

  it('should handle empty changelog records gracefully', () => {
    // Arrange
    const snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[] = [
      {
        id: 1,
        changelogRecords: [],
        direction: 'up',
        recordType: 'test',
        recordId: 'record1',
        isDeleted: false,
        data: {
          id: 1,
        },
        savedAtSyncTick: 0,
        updatedAtByFieldSum: 0,
        syncLookupId: 0,
        requiresRepull: false,
      },
    ];

    // Act
    const result = extractChangelogFromSnapshotRecords(snapshotRecordsWithChangelog);

    // Assert
    expect(result.changelogRecords).toHaveLength(0);
    expect(result.snapshotRecords).toHaveLength(1);
    expect(result.snapshotRecords[0].changelogRecords).toBeUndefined();
  });

  it('should handle records without changelog records', () => {
    // Arrange
    const snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[] = [
      {
        id: 1,
        direction: 'up',
        recordType: 'test',
        recordId: 'record1',
        isDeleted: false,
        data: {
          id: 1,
        },
        savedAtSyncTick: 0,
        updatedAtByFieldSum: 0,
        syncLookupId: 0,
        requiresRepull: false,
      },
    ];

    // Act
    const result = extractChangelogFromSnapshotRecords(snapshotRecordsWithChangelog);

    // Assert
    expect(result.changelogRecords).toHaveLength(0);
    expect(result.snapshotRecords).toHaveLength(1);
    expect(result.snapshotRecords[0]).toEqual(snapshotRecordsWithChangelog[0]);
  });

  it('should handle empty input array', () => {
    // Arrange
    const snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[] = [];

    // Act
    const result = extractChangelogFromSnapshotRecords(snapshotRecordsWithChangelog);

    // Assert
    expect(result.changelogRecords).toHaveLength(0);
    expect(result.snapshotRecords).toHaveLength(0);
  });
});
