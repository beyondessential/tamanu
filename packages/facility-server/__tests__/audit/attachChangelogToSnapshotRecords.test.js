import { SYSTEM_USER_UUID } from "@tamanu/constants";
import { attachChangelogToSnapshotRecords } from "@tamanu/database";
import { createTestContext } from "../utilities";
import { fake } from "@tamanu/fake-data/fake";

describe('attachChangelogToSnapshotRecords', () => {
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
    const { ChangeLog } = models;
    await ChangeLog.destroy({ where: {} });
  });

  it('should attach changelog records to snapshot records inclusively within the specified tick range', async () => {
    const { ChangeLog } = models;
    await Promise.all([
      ChangeLog.create(fake(models.ChangeLog, {
        tableName: 'patients',
        recordSyncTick: 100,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordData: { name: 'John Doe' },
      })),
      ChangeLog.create(fake(models.ChangeLog, {
        tableName: 'patients',
        recordSyncTick: 150,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordData: { name: 'John Doe Jr' },
      })),
      ChangeLog.create(fake(models.ChangeLog, {
        tableName: 'patients',
        recordSyncTick: 200,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '2',
        recordData: { name: 'Jane Smith' },
      })),
      ChangeLog.create(fake(models.ChangeLog, {
        tableName: 'encounters',
        recordSyncTick: 300,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordData: { type: 'checkup' },
      })),
    ]);

    const snapshotRecords = [
      { recordType: 'patients', recordId: '1' },
      { recordType: 'patients', recordId: '2' },
      { recordType: 'encounters', recordId: '1' },
    ];

    const result = await attachChangelogToSnapshotRecords({
      models,
      sequelize
    }, snapshotRecords, {
      minSourceTick: 100,
      maxSourceTick: 200,
    });

    expect(result).toHaveLength(3);

    // Check patient 1 has both changelog records
    const patient1 = result.find((r) => r.recordId === '1');
    expect(patient1?.changelogRecords).toHaveLength(2);
    expect(patient1?.changelogRecords.map((r) => r.recordSyncTick).sort()).toEqual(["100", "150"]);

    // Check patient 2 has one changelog record
    const patient2 = result.find((r) => r.recordId === '2');
    expect(patient2?.changelogRecords).toHaveLength(1);
    expect(patient2?.changelogRecords[0].recordSyncTick).toBe("200");

    // Check encounter 1 has no changelog records (outside tick range)
    const encounter1 = result.find((r) => r.recordId === '1' && r.recordType === 'encounters');
    expect(encounter1?.changelogRecords).toHaveLength(0);
  });

  it('should filter changelog records by table whitelist', async () => {
    // Insert test data
    const { ChangeLog } = models;
    await Promise.all([
      ChangeLog.create(fake(models.ChangeLog, {
        tableName: 'patients',
        recordSyncTick: 100,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordData: { name: 'John Doe' },
      })),
      ChangeLog.create(fake(models.ChangeLog, {
        tableName: 'encounters',
        recordSyncTick: 100,
        updatedByUserId: SYSTEM_USER_UUID,
        recordId: '1',
        recordData: { type: 'checkup' },
      })),
    ]);

    const snapshotRecords = [
      { recordType: 'patients', recordId: '1' },
      { recordType: 'encounters', recordId: '1' },
    ];

    const result = await attachChangelogToSnapshotRecords({
      models,
      sequelize
    }, snapshotRecords, {
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
    const result = await attachChangelogToSnapshotRecords({
      models,
      sequelize
    }, [], {
      minSourceTick: 0,
    });

    expect(result).toHaveLength(0);
  });
});
