import { attachChangelogToSnapshotRecords } from '../../../src/utils/audit/attachChangelogToSnapshotRecords';
import { createTestDatabase, closeDatabase } from '../../sync/utilities';
import { describe, beforeAll, afterAll, it, expect, afterEach } from 'vitest';
import { SYSTEM_USER_UUID } from '@tamanu/constants/auth';

describe('attachChangelogToSnapshotRecords', () => {
  let models;
  let sequelize;

  beforeAll(async () => {
    const database = await createTestDatabase();
    models = database.models;
    sequelize = database.sequelize;
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS logs.changes (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        table_oid integer NOT NULL,
        table_schema text NOT NULL,
        table_name text NOT NULL,
        logged_at timestamp with time zone NOT NULL DEFAULT now(),
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        deleted_at timestamp with time zone,
        updated_by_user_id text NOT NULL REFERENCES users(id),
        device_id text NOT NULL DEFAULT 'unknown',
        version text NOT NULL DEFAULT 'unknown',
        record_id text NOT NULL,
        record_update boolean NOT NULL,
        record_created_at timestamp with time zone NOT NULL,
        record_updated_at timestamp with time zone NOT NULL,
        record_deleted_at timestamp with time zone,
        record_sync_tick bigint NOT NULL,
        record_data jsonb NOT NULL
      );
  `);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    const { ChangeLog } = models;
    await ChangeLog.destroy({ where: {} });
  });

  it('should attach changelog records to snapshot records within the specified tick range', async () => {
    const { ChangeLog } = models;
    await Promise.all([
      ChangeLog.create({
        tableOid: 1234,
        tableSchema: 'public',
        tableName: 'patients',
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        recordSyncTick: 100,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordUpdate: true,
        recordData: { name: 'John Doe' },
      }),
      ChangeLog.create({
        tableOid: 1234,
        tableSchema: 'public',
        tableName: 'patients',
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        recordSyncTick: 150,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordUpdate: true,
        recordData: { name: 'John Doe Jr' },
      }),
      ChangeLog.create({
        tableOid: 1234,
        tableSchema: 'public',
        tableName: 'patients',
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        recordSyncTick: 200,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '2',
        recordUpdate: true,
        recordData: { name: 'Jane Smith' },
      }),
      ChangeLog.create({
        tableOid: 5678,
        tableSchema: 'public',
        tableName: 'encounters',
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        recordSyncTick: 300,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordUpdate: true,
        recordData: { type: 'checkup' },
      }),
    ]);

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
    expect(patient1?.changelogRecords[0].updated_at_sync_tick).toBe('100');
    expect(patient1?.changelogRecords[1].updated_at_sync_tick).toBe('150');

    // Check patient 2 has one changelog record
    const patient2 = result.find((r) => r.recordId === '2');
    expect(patient2?.changelogRecords).toHaveLength(1);
    expect(patient2?.changelogRecords[0].updated_at_sync_tick).toBe('200');

    // Check encounter 1 has no changelog records (outside tick range)
    const encounter1 = result.find((r) => r.recordId === '1' && r.recordType === 'encounters');
    expect(encounter1?.changelogRecords).toHaveLength(0);
  });

  it('should filter changelog records by table whitelist', async () => {
    // Insert test data
    const { ChangeLog } = models;
    await Promise.all([
      ChangeLog.create({
        tableOid: 1234,
        tableSchema: 'public',
        tableName: 'patients',
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        recordSyncTick: 100,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordUpdate: true,
        recordData: { name: 'John Doe' },
      }),
      ChangeLog.create({
        tableOid: 1234,
        tableSchema: 'public',
        tableName: 'encounters',
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        recordSyncTick: 100,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordUpdate: true,
        recordData: { type: 'checkup' },
      }),
    ]);

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
    expect(encounter1?.changelogRecords).toHaveLength(0);
  });

  it('should handle empty snapshot records', async () => {
    const result = await attachChangelogToSnapshotRecords(sequelize, [], {
      minSourceTick: 0,
    });

    expect(result).toHaveLength(0);
  });
});
