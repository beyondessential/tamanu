import { describe, expect, it } from 'vitest';

import { extractChangelogFromSnapshotRecords } from '../../src/utils/audit/extractChangelogFromSnapshotRecords';
import type {
  SyncSnapshotAttributesWithChangelog,
  ChangelogRecord,
} from '../../src/utils/audit/attachChangelogRecordsToSnapshot';

describe('extractChangelogFromSnapshotRecords', () => {
  it('should extract changelog records from snapshot records', () => {
    // Arrange
    const changelogRecords: ChangelogRecord[] = [
      { record_id: 'record1', id: 'dogman-1' } as ChangelogRecord,
      { record_id: 'record1', id: 'dogman-2' } as ChangelogRecord,
    ];

    const snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[] = [
      {
        id: 'record1',
        someAttribute: 'value1',
        changelogRecords: changelogRecords,
      } as SyncSnapshotAttributesWithChangelog,
      {
        id: 'record2',
        someAttribute: 'value2',
        // No changelog records
      } as SyncSnapshotAttributesWithChangelog,
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
    expect(result.snapshotRecords[0].id).toBe('record1');
    expect(result.snapshotRecords[0].someAttribute).toBe('value1');
    expect(result.snapshotRecords[1].id).toBe('record2');
    expect(result.snapshotRecords[1].someAttribute).toBe('value2');
  });

  it('should handle empty changelog records gracefully', () => {
    // Arrange
    const snapshotRecordsWithChangelog: SyncSnapshotAttributesWithChangelog[] = [
      {
        id: 'record1',
        someAttribute: 'value1',
        changelogRecords: [],
      } as SyncSnapshotAttributesWithChangelog,
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
        id: 'record1',
        someAttribute: 'value1',
        // No changelog records
      } as SyncSnapshotAttributesWithChangelog,
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
