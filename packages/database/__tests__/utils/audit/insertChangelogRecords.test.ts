import { describe, expect, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createTestDatabase, closeDatabase } from '../../sync/utilities';
import { insertChangelogRecords } from '../../../src/utils/audit/insertChangelogRecords';
import { SYSTEM_USER_UUID } from '@tamanu/constants/auth';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

describe('insertChangelogRecords', () => {
  let sequelize;

  beforeAll(async () => {
    const database = await createTestDatabase();
    sequelize = database.sequelize;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear the changes table before each test
    await sequelize.query('TRUNCATE TABLE logs.changes');
  });

  it('should not insert anything when no changelog records are provided', async () => {
    // Act
    await insertChangelogRecords(sequelize, []);

    // Assert
    const result = await sequelize.query('SELECT COUNT(*) FROM logs.changes');
    expect(result[0][0].count).toBe('0');
  });

  it('should filter out existing records before inserting', async () => {
    // Arrange - Insert an existing record
    await sequelize.query(`
      INSERT INTO logs.changes (
        table_oid,
        table_schema,
        table_name,
        logged_at,
        created_at,
        updated_at,
        updated_at_sync_tick,
        updated_by_user_id,
        record_id,
        record_update,
        record_data
      )
      VALUES
        (1234, 'public', 'patients', NOW(), NOW(), NOW(), 100, '${SYSTEM_USER_UUID}', '1', true, '{"first_name": "Patient 1"}'::jsonb);
    `);

    const changelogRecords = [
      {
        table_oid: 1234,
        logged_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        updated_by_user_id: SYSTEM_USER_UUID,
        record_update: true,
        table_name: 'patients',
        table_schema: 'public',
        record_id: '1',
        record_data: { first_name: 'Patient 1' },
        updated_at_sync_tick: 100,
      },
      {
        table_oid: 1234,
        logged_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        updated_by_user_id: SYSTEM_USER_UUID,
        record_update: true,
        table_name: 'patients',
        table_schema: 'public',
        record_id: '2',
        record_data: { first_name: 'Patient 2' },
        updated_at_sync_tick: 100,
      },
      {
        table_oid: 2345,
        logged_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        updated_by_user_id: SYSTEM_USER_UUID,
        record_update: true,
        table_name: 'encounters',
        table_schema: 'public',
        record_id: '3',
        record_data: { encounter_type: ENCOUNTER_TYPES.ADMISSION },
        updated_at_sync_tick: 100,
      },
    ];

    // Act
    await insertChangelogRecords(sequelize, changelogRecords);

    // Assert
    const result = await sequelize.query('SELECT * FROM logs.changes ORDER BY record_id');
    expect(result[0]).toHaveLength(2); // Should only have 2 records (excluding the existing one)

    // Check the inserted records
    const insertedRecords = result[0];
    expect(insertedRecords[0].record_id).toBe('2');
    expect(insertedRecords[0].table_name).toBe('patients');
    expect(insertedRecords[1].record_id).toBe('3');
    expect(insertedRecords[1].table_name).toBe('encounters');
  });

  it('should stringify record_data before inserting', async () => {
    // Arrange
    const recordData = { first_name: 'Patient 1', age: 30 };
    const changelogRecords = [
      {
        table_oid: 1234,
        logged_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        updated_by_user_id: SYSTEM_USER_UUID,
        record_update: true,
        table_name: 'patients',
        table_schema: 'public',
        record_id: '1',
        record_data: recordData,
        updated_at_sync_tick: 123,
      },
    ];

    // Act
    await insertChangelogRecords(sequelize, changelogRecords);

    // Assert
    const result = await sequelize.query('SELECT * FROM logs.changes');
    expect(result[0][0].record_data).toMatchObject(recordData);
  });
});
