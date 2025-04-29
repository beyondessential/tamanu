import { attachChangelogToSnapshotRecords } from '../../../src/utils/audit/attachChangelogToSnapshotRecords';
import { createTestDatabase, closeDatabase } from '../../sync/utilities';
import {describe, beforeAll, afterAll, it, expect, afterEach} from 'vitest';
import {SYSTEM_USER_UUID} from '@tamanu/constants/auth'

describe('attachChangelogToSnapshotRecords', () => {
  let sequelize;

  beforeAll(async () => {
    const database = await createTestDatabase();
    sequelize = database.sequelize;

    // Create logs schema and changes table
    // Database tests not running migrations properly?
    await sequelize.query(`
      CREATE SCHEMA IF NOT EXISTS logs;
      CREATE TABLE IF NOT EXISTS logs.changes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        table_oid INTEGER NOT NULL,
        table_schema TEXT NOT NULL,
        table_name TEXT NOT NULL,
        logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE,
        updated_at_sync_tick BIGINT NOT NULL,
        updated_by_user_id TEXT NOT NULL,
        record_id TEXT NOT NULL,
        record_update BOOLEAN NOT NULL,
        record_data JSONB NOT NULL
      );
    `); 
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    // Clear the changes table before each test
    await sequelize.query('TRUNCATE TABLE logs.changes');
  });

  it('should attach changelog records to snapshot records within the specified tick range', async () => {
    // Insert some test changelog records
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
        (1234, 'public', 'patients', NOW(), NOW(), NOW(), 100, '${SYSTEM_USER_UUID}', '1', true, '{"name": "John Doe"}'::jsonb),
        (1234, 'public', 'patients', NOW(), NOW(), NOW(), 150, '${SYSTEM_USER_UUID}', '1', true, '{"name": "John Doe Jr"}'::jsonb),
        (1234, 'public', 'patients', NOW(), NOW(), NOW(), 200, '${SYSTEM_USER_UUID}', '2', true, '{"name": "Jane Smith"}'::jsonb),
        (5678, 'public', 'encounters', NOW(), NOW(), NOW(), 300, '${SYSTEM_USER_UUID}', '1', true, '{"type": "checkup"}'::jsonb);
    `);

    const snapshotRecords = [
      { recordType: 'patients', recordId: '1' },
      { recordType: 'patients', recordId: '2' },
      { recordType: 'encounters', recordId: '1' },
    ];

    const result = await attachChangelogToSnapshotRecords(sequelize, snapshotRecords, {
      minSourceTick: 99,
      maxSourceTick: 251,
    });

    expect(result).toHaveLength(3);

    // Check patient 1 has both changelog records
    const patient1 = result.find((r) => r.recordId === '1');
    expect(patient1?.changelogRecords).toHaveLength(2);
    expect(patient1?.changelogRecords[0].updated_at_sync_tick).toBe("100");
    expect(patient1?.changelogRecords[1].updated_at_sync_tick).toBe("150");

    // Check patient 2 has one changelog record
    const patient2 = result.find((r) => r.recordId === '2');
    expect(patient2?.changelogRecords).toHaveLength(1);
    expect(patient2?.changelogRecords[0].updated_at_sync_tick).toBe("200");

    // Check encounter 1 has no changelog records (outside tick range)
    const encounter1 = result.find((r) => r.recordId === '1' && r.recordType === 'encounters');
    expect(encounter1?.changelogRecords).toHaveLength(0);
  });

  it('should filter changelog records by table whitelist', async () => {
    // Insert test data
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
        (1234, 'public', 'patients', NOW(), NOW(), NOW(), 100, '${SYSTEM_USER_UUID}', '1', true, '{"name": "John Doe"}'::jsonb),
        (1234, 'public', 'encounters', NOW(), NOW(), NOW(), 100, '${SYSTEM_USER_UUID}', '1', true, '{"type": "checkup"}'::jsonb);
    `);

    const snapshotRecords = [
      { recordType: 'patients', recordId: '1' },
      { recordType: 'encounters', recordId: '1' },
    ];

    const result = await attachChangelogToSnapshotRecords(sequelize, snapshotRecords, {
      minSourceTick: 0,
      tableWhitelist: ['patients'],
    });

    expect(result).toHaveLength(2);

    // Check only patient records have changelog entries
    const patient1 = result.find((r) => r.recordType === 'patients');
    expect(patient1?.changelogRecords).toHaveLength(1);

    const encounter1 = result.find((r) => r.recordType === 'encounters');
    console.log(encounter1?.changelogRecords);
    expect(encounter1?.changelogRecords).toHaveLength(0);
  });

  it('should handle empty snapshot records', async () => {
    const result = await attachChangelogToSnapshotRecords(sequelize, [], {
      minSourceTick: 0,
    });

    expect(result).toHaveLength(0);
  });
});
