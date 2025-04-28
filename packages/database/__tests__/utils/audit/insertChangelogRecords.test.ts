import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Sequelize, Op } from 'sequelize';

import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

import { insertChangelogRecords } from '../../../src/utils/audit/insertChangelogRecords';
import type { ChangelogRecord } from '../../../src/utils/audit/attachChangelogRecordsToSnapshot';

// Mock dependencies
vi.mock('config', () => ({
  default: {},
}));

vi.mock('@tamanu/utils/selectFacilityIds', () => ({
  selectFacilityIds: vi.fn(),
}));

describe('insertChangelogRecords', () => {
  // Setup mocks
  const mockQueryInterface = {
    select: vi.fn(),
    bulkInsert: vi.fn(),
  };

  const mockSequelize = {
    getQueryInterface: vi.fn().mockReturnValue(mockQueryInterface),
  } as unknown as Sequelize;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not insert anything when no changelog records are provided', async () => {
    // Arrange
    const changelogRecords: ChangelogRecord[] = [];

    // Act
    await insertChangelogRecords(mockSequelize, changelogRecords);

    // Assert
    expect(mockSequelize.getQueryInterface).not.toHaveBeenCalled();
    expect(mockQueryInterface.select).not.toHaveBeenCalled();
    expect(mockQueryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  it('should filter out existing records before inserting', async () => {
    // Arrange
    const changelogRecords: ChangelogRecord[] = [
      { table_name: 'patients', record_id: '1', record_data: { first_name: 'Patient 1' } } as ChangelogRecord,
      { table_name: 'patients', record_id: '2', record_data: { first_name: 'Patient 2' } } as ChangelogRecord,
      { table_name: 'encounters', record_id: '3', record_data: { encounter_type: ENCOUNTER_TYPES.ADMISSION } } as ChangelogRecord,
    ];

    // Mock existing records
    mockQueryInterface.select.mockResolvedValue([
      { table_name: 'patients', record_id: '1' },
    ]);

    // Act
    await insertChangelogRecords(mockSequelize, changelogRecords);

    // Assert
    expect(mockSequelize.getQueryInterface).toHaveBeenCalled();
    expect(mockQueryInterface.select).toHaveBeenCalledWith(
      null,
      { tableName: 'changes', schema: 'logs' },
      {
        where: {
          [Op.or]: changelogRecords.map(({ table_name, record_id }) => ({
            table_name,
            record_id,
          })),
        },
      },
    );

    // Should only insert records that don't already exist
    expect(mockQueryInterface.bulkInsert).toHaveBeenCalledWith(
      { tableName: 'changes', schema: 'logs' },
      expect.arrayContaining([
        expect.objectContaining({ 
          table_name: 'patients', 
          record_id: '2',
          record_data: expect.any(String),
        }),
        expect.objectContaining({ 
          table_name: 'encounters', 
          record_id: '3',
          record_data: expect.any(String),
        }),
      ]),
    );
    
    // Should not include the existing record
    const insertedRecords = mockQueryInterface.bulkInsert.mock.calls[0][1];
    expect(insertedRecords).toHaveLength(2);
    expect(insertedRecords.find(r => r.record_id === '1')).toBeUndefined();
  });

  it('should set updated_at_sync_tick to -999 for facility records', async () => {
    // Arrange
    (selectFacilityIds as jest.Mock).mockReturnValue(['facility1']);
    
    const changelogRecords: ChangelogRecord[] = [
      { table_name: 'patients', record_id: '1', record_data: { first_name: 'Patient 1' }, updated_at_sync_tick: 123 } as ChangelogRecord,
    ];

    mockQueryInterface.select.mockResolvedValue([]);

    // Act
    await insertChangelogRecords(mockSequelize, changelogRecords);

    // Assert
    expect(mockQueryInterface.bulkInsert).toHaveBeenCalledWith(
      { tableName: 'changes', schema: 'logs' },
      expect.arrayContaining([
        expect.objectContaining({ 
          updated_at_sync_tick: -999 
        }),
      ]),
    );
  });

  it('should preserve updated_at_sync_tick for non-facility records', async () => {
    // Arrange
    (selectFacilityIds as jest.Mock).mockReturnValue(null);
    
    const changelogRecords: ChangelogRecord[] = [
      { table_name: 'patients', record_id: '1', record_data: { first_name: 'Patient 1' }, updated_at_sync_tick: 123 } as ChangelogRecord,
    ];

    mockQueryInterface.select.mockResolvedValue([]);

    // Act
    await insertChangelogRecords(mockSequelize, changelogRecords);

    // Assert
    const insertedRecords = mockQueryInterface.bulkInsert.mock.calls[0][1];
    expect(insertedRecords[0].updated_at_sync_tick).toBe(123);
  });

  it('should stringify record_data before inserting', async () => {
    // Arrange
    const recordData = { first_name: 'Patient 1', age: 30 };
    const changelogRecords: ChangelogRecord[] = [
      { table_name: 'patients', record_id: '1', record_data: recordData, updated_at_sync_tick: 123 } as ChangelogRecord,
    ];

    mockQueryInterface.select.mockResolvedValue([]);

    // Act
    await insertChangelogRecords(mockSequelize, changelogRecords);

    // Assert
    const insertedRecords = mockQueryInterface.bulkInsert.mock.calls[0][1];
    expect(insertedRecords[0].record_data).toBe(JSON.stringify(recordData));
  });
});
