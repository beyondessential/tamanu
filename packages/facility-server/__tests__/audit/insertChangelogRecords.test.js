import { insertChangelogRecords } from '@tamanu/database';
import { createTestContext } from '../utilities';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { ENCOUNTER_TYPES, SYSTEM_USER_UUID } from '@tamanu/constants';

describe('insertChangeLogRecords', () => {
  let ctx;
  let models;
  let sequelize;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    // Clear the changes table before each test
    await models.ChangeLog.destroy({ where: {} });
  });

  it('should not insert anything when no changelog records are provided', async () => {
    // Act
    await insertChangelogRecords(models, []);

    // Assert
    const [result] = await sequelize.query('SELECT COUNT(*) FROM logs.changes');
    expect(result[0].count).toBe('0');
  });

  it('should filter out existing records before inserting', async () => {
    // Arrange - Insert an existing record
    const existingRecord = await models.ChangeLog.create({
      tableOid: 1234,
      tableSchema: 'public',
      tableName: 'patients',
      loggedAt: new Date(),
      recordCreatedAt: new Date(),
      recordUpdatedAt: new Date(),
      updatedByUserId: SYSTEM_USER_UUID,
      recordId: '1',
      recordSyncTick: '100',
      recordUpdate: true,
      recordData: { first_name: 'Patient 1' },
    });

    const changelogRecords = [
      {
        // Existing record
        id: existingRecord.id,
        tableOid: 1234,
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        updatedByUserId: SYSTEM_USER_UUID,
        recordUpdate: true,
        tableName: 'patients',
        tableSchema: 'public',
        recordId: '1',
        recordData: { first_name: 'Patient Updated' },
        recordSyncTick: '100',
      },
      {
        // New record
        id: '2f582bab-523e-4e25-bae6-2ab7178118df',
        tableOid: 1234,
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        updatedByUserId: SYSTEM_USER_UUID,
        recordUpdate: true,
        tableName: 'patients',
        tableSchema: 'public',
        recordId: '2',
        recordData: { first_name: 'Patient 2' },
        recordSyncTick: '100',
      },
      {
        // New record
        id: '3f582bab-523e-4e25-bae6-2ab7178118df',
        tableOid: 2345,
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        updatedByUserId: SYSTEM_USER_UUID,
        recordUpdate: true,
        tableName: 'encounters',
        tableSchema: 'public',
        recordId: '3',
        recordData: { encounter_type: ENCOUNTER_TYPES.ADMISSION },
        recordSyncTick: '100',
      },
    ];

    // Act
    await insertChangelogRecords(models, changelogRecords);

    // Assert
    const results = await models.ChangeLog.findAll({
      order: [['recordId', 'ASC']],
    });
    expect(results).toHaveLength(3); // Should have 3 records (existing + 2 new)

    // Should ignore the change to the existing record as changelog records are immutable
    expect(results[0].recordData).toEqual({ first_name: 'Patient 1' });
    // Check the inserted records
    expect(results[1].recordId).toBe('2');
    expect(results[1].tableName).toBe('patients');
    expect(results[2].recordId).toBe('3');
    expect(results[2].tableName).toBe('encounters');
  });

  it('should set recordSyncTick to SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE for facility records', async () => {
    // Arrange
    const changelogRecords = [
      {
        tableOid: 1234,
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        updatedByUserId: SYSTEM_USER_UUID,
        recordUpdate: true,
        tableName: 'patients',
        tableSchema: 'public',
        recordId: '1',
        recordData: { first_name: 'Patient 1' },
        recordSyncTick: '123',
      },
    ];

    // Act
    await insertChangelogRecords(models, changelogRecords, true);

    // Assert
    const result = await models.ChangeLog.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].recordSyncTick).toBe(`${SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE}`);
  });

  it('should preserve recordSyncTick for non-facility records', async () => {
    // Arrange
    const changelogRecords = [
      {
        tableOid: 1234,
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        updatedByUserId: SYSTEM_USER_UUID,
        recordUpdate: true,
        tableName: 'patients',
        tableSchema: 'public',
        recordId: '2',
        recordData: { first_name: 'Patient 2' },
        recordSyncTick: '123',
      },
    ];

    // Act
    await insertChangelogRecords(models, changelogRecords, false);

    // Assert
    const result = await models.ChangeLog.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].recordSyncTick).toBe("123");
  });

  it('should stringify recordData before inserting', async () => {
    // Arrange
    const recordData = { first_name: 'Patient 1', age: 30 };
    const changelogRecords = [
      {
        tableOid: 1234,
        loggedAt: new Date(),
        recordCreatedAt: new Date(),
        recordUpdatedAt: new Date(),
        updatedByUserId: SYSTEM_USER_UUID,
        recordUpdate: true,
        tableName: 'patients',
        tableSchema: 'public',
        recordId: '1',
        recordData: recordData,
        recordSyncTick: '123',
      },
    ];

    // Act
    await insertChangelogRecords(models, changelogRecords);

    // Assert
    const [changelog] = await models.ChangeLog.findAll();
    expect(changelog.recordData).toMatchObject(recordData);
  });
});
