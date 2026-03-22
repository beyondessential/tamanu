import { createTestContext } from '../utilities';
import { FacilitySyncManager } from '../../dist/sync/FacilitySyncManager';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LAST_SUCCESSFUL_SYNC_PULL
} from '@tamanu/constants/facts';
import { fake } from '@tamanu/fake-data/fake';



describe('FacilitySyncManager integration', () => {
  let ctx;
  let models;
  let sequelize;
  let syncManager;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
    await models.Setting.set('audit.changes.enabled', true);
  });

  afterAll(() => ctx.close());

  const mockCentralServer = {
    streaming: () => false,
    startSyncSession: jest.fn().mockResolvedValue({
      sessionId: 'test-session-sync',
      startedAtTick: 200
    }),
    endSyncSession: jest.fn().mockResolvedValue({}),
    initiatePull: jest.fn().mockResolvedValue({
      totalToPull: 3,
      pullUntil: 200
    }),
    completePush: jest.fn(),
    push: jest.fn(),
    pull: jest.fn().mockImplementation(async () => [
        {
          id: '1',
          recordType: 'patients',
          recordId: 'patient-1',
          isDeleted: false,
          data: {
            ...fake(models.Patient, {
              id: 'patient-1',
              displayId: 'SYNC001',
              firstName: 'Test',
              lastName: 'Patient1'
            }),
            updatedAtSyncTick: -1
          }
        },
        {
          id: '2',
          recordType: 'patients',
          recordId: 'patient-2',
          isDeleted: false,
          data: {
            ...fake(models.Patient, {
              id: 'patient-2',
              displayId: 'SYNC002',
              firstName: 'Test',
              lastName: 'Patient2'
            }),
            updatedAtSyncTick: -1
          }
        },
        {
          id: '3',
          recordType: 'facilities',
          recordId: 'facility-1',
          isDeleted: false,
          data: {
            ...fake(models.Facility, {
              id: 'facility-1',
              code: 'TESTSYNC',
              name: 'Test Sync Facility'
            }),
            updatedAtSyncTick: -1
          }
      }
    ])
  };

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '50');
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '0');
    syncManager = new FacilitySyncManager({
      models,
      sequelize,
      centralServer: mockCentralServer
    });
  });

  afterEach(async () => {
    await models.Patient.destroy({ where: { id: ['patient-1', 'patient-2'] }, force: true });
    await models.Setting.destroy({ where: { facilityId: 'facility-1' }, force: true });
    await models.Facility.destroy({ where: { id: 'facility-1' }, force: true });
    await sequelize.query("DELETE FROM logs.changes WHERE record_id IN ('patient-1', 'patient-2', 'facility-1')");
  });

  it('does not record audit changelogs during incoming sync from central server', async () => {
    // Verify that normal operations DO create audit logs
    await models.Patient.create({
      ...fake(models.Patient, {
        id: 'normal-patient-test',
        displayId: 'NORMAL001',
        firstName: 'Normal',
        lastName: 'Creation'
      })
    });
    const normalAuditLogs = await sequelize.query(
      "SELECT * FROM logs.changes WHERE record_id = 'normal-patient-test'",
      { type: sequelize.QueryTypes.SELECT }
    );
    expect(normalAuditLogs).toHaveLength(1);
    expect(normalAuditLogs[0]).toMatchObject({
      table_name: 'patients',
      record_id: 'normal-patient-test'
    });

    const result = await syncManager.triggerSync('test-sync');

    expect(result).toMatchObject({
      enabled: true,
      ran: true
    });

    // Verify all records were synced correctly
    const [syncedPatient1, syncedPatient2, syncedFacility] = await Promise.all([
      models.Patient.findByPk('patient-1'),
      models.Patient.findByPk('patient-2'),
      models.Facility.findByPk('facility-1')
    ]);

    expect(syncedPatient1).toMatchObject({
      firstName: 'Test',
      lastName: 'Patient1',
      displayId: 'SYNC001'
    });

    expect(syncedPatient2).toMatchObject({
      firstName: 'Test',
      lastName: 'Patient2',
      displayId: 'SYNC002'
    });

    expect(syncedFacility).toMatchObject({
      name: 'Test Sync Facility',
      code: 'TESTSYNC'
    });

    const syncAuditLogs = await sequelize.query(
      "SELECT * FROM logs.changes WHERE record_id IN ('patient-1', 'patient-2', 'facility-1')",
      { type: sequelize.QueryTypes.SELECT }
    );
    expect(syncAuditLogs).toHaveLength(0);
  });
});