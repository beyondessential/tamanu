import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestContext } from '../utilities';
import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH
} from '@tamanu/constants/facts';
import { fake } from '@tamanu/fake-data/fake';
import { dropSnapshotTable, getModelsForPush, SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { snapshotOutgoingChanges } from '../../app/sync/snapshotOutgoingChanges';



describe('FacilitySyncManager integration', () => {
  let ctx;
  let models;
  let sequelize;
  let syncManager;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  const mockCentralServer = {
    streaming: () => false,
    startSyncSession: vi.fn().mockResolvedValue({
      sessionId: 'test-session-sync',
      startedAtTick: 200
    }),
    endSyncSession: vi.fn().mockResolvedValue({}),
    initiatePull: vi.fn().mockResolvedValue({
      totalToPull: 3,
      pullUntil: 200
    }),
    completePush: vi.fn(),
    push: vi.fn(),
    pull: vi.fn().mockImplementation(async () => [
        {
          id: '1',
          recordType: 'patients',
          recordId: 'sync-integration-patient-1',
          isDeleted: false,
          data: {
            ...fake(models.Patient, {
              id: 'sync-integration-patient-1',
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
          recordId: 'sync-integration-patient-2',
          isDeleted: false,
          data: {
            ...fake(models.Patient, {
              id: 'sync-integration-patient-2',
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
          recordId: 'sync-integration-facility',
          isDeleted: false,
          data: {
            ...fake(models.Facility, {
              id: 'sync-integration-facility',
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
    await models.Patient.destroy({
      where: { id: ['sync-integration-patient-1', 'sync-integration-patient-2', 'push-kept', 'push-removed'] },
      force: true
    });
    await models.Setting.destroy({ where: { facilityId: 'sync-integration-facility' }, force: true });
    await models.Facility.destroy({ where: { id: 'sync-integration-facility' }, force: true });
    await sequelize.query(
      "DELETE FROM logs.changes WHERE record_id IN ('sync-integration-patient-1', 'sync-integration-patient-2', 'sync-integration-facility', 'push-kept', 'push-removed')"
    );
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
      models.Patient.findByPk('sync-integration-patient-1'),
      models.Patient.findByPk('sync-integration-patient-2'),
      models.Facility.findByPk('sync-integration-facility')
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
      "SELECT * FROM logs.changes WHERE record_id IN ('sync-integration-patient-1', 'sync-integration-patient-2', 'sync-integration-facility')",
      { type: sequelize.QueryTypes.SELECT }
    );
    expect(syncAuditLogs).toHaveLength(0);
  });

  it('does not push the changelog of a hard-deleted record', async () => {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '0');

    await models.Patient.create(fake(models.Patient, { id: 'push-kept', displayId: 'PUSHKEPT' }));
    const removed = await models.Patient.create(
      fake(models.Patient, { id: 'push-removed', displayId: 'PUSHGONE' })
    );
    await removed.destroy({ force: true });

    mockCentralServer.push.mockClear();
    await syncManager.pushChanges('test-session-sync', 300);

    const deletionLogs = await sequelize.query(
      "SELECT record_id FROM logs.changes WHERE record_id = 'push-removed' AND is_hard_delete",
      { type: sequelize.QueryTypes.SELECT }
    );
    expect(deletionLogs).toHaveLength(1);

    const pushed = mockCentralServer.push.mock.calls.flatMap(([, page]) => page);
    const pushedIds = pushed.map(record => record.recordId);
    expect(pushedIds).toContain('push-kept');
    expect(pushedIds).not.toContain('push-removed');

    const pushedChangelogIds = pushed.flatMap(record =>
      (record.changelogRecords ?? []).map(entry => entry.recordId)
    );
    expect(pushedChangelogIds).toContain('push-kept');
    expect(pushedChangelogIds).not.toContain('push-removed');
  });
  // Regression: a facility used to stamp deletes and restores pulled from central with a live sync
  // tick (destroy()/restore() left updated_at_sync_tick out of the statement), so a bulk delete on
  // central was echoed straight back to it by every facility that pulled it.
  describe('records persisted from a central pull are never pushed back', () => {
    const SESSION_ID = 'test-session-sync';
    const PATIENT_ID = 'sync-integration-pulled-patient';
    const patientData = () =>
      fake(models.Patient, { id: PATIENT_ID, displayId: 'SYNCPULL', firstName: 'Pulled' });
    const removePatient = async () => {
      await models.Patient.destroy({ where: { id: PATIENT_ID }, force: true });
      await sequelize.query('DELETE FROM logs.changes WHERE record_id = :id', {
        replacements: { id: PATIENT_ID },
      });
    };

    const pullOneRecord = async record => {
      // central only sends records it has already received from this facility, so the local write
      // set up by the test sits below the push watermark by the time the pull arrives (otherwise
      // assertIfPulledRecordsUpdatedAfterPushSnapshot rightly aborts the sync to push it first)
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '100');
      mockCentralServer.initiatePull.mockResolvedValueOnce({ totalToPull: 1, pullUntil: 200 });
      mockCentralServer.pull.mockResolvedValueOnce([
        { id: '1', recordType: 'patients', recordId: PATIENT_ID, ...record },
      ]);
      await syncManager.pullChanges(SESSION_ID);
    };

    // snapshot from the beginning of time so the check is about the row's own tick, not the
    // watermark
    const outgoingPatientIds = async () => {
      const changes = await snapshotOutgoingChanges(sequelize, getModelsForPush(models), 0);
      return changes.filter(change => change.recordType === 'patients').map(c => c.recordId);
    };

    const expectNotPushable = record =>
      expect(Number(record.updatedAtSyncTick)).toBe(SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE);

    beforeEach(async () => {
      await removePatient(); // in case an earlier run died before cleaning up
    });

    afterEach(async () => {
      await dropSnapshotTable(sequelize, SESSION_ID);
      await removePatient();
    });

    it('does not push a pulled delete back to central', async () => {
      const data = patientData();
      await models.Patient.create(data);
      // a local write is pushable until central has seen it
      expect(await outgoingPatientIds()).toContain(PATIENT_ID);

      await pullOneRecord({ isDeleted: true, data: { ...data, updatedAtSyncTick: -1 } });

      const patient = await models.Patient.findByPk(PATIENT_ID, { paranoid: false });
      expect(patient.deletedAt).not.toBeNull();
      expectNotPushable(patient);
      expect(await outgoingPatientIds()).not.toContain(PATIENT_ID);
    });

    it('does not push a pulled restore back to central', async () => {
      const data = patientData();
      const created = await models.Patient.create(data);
      await created.destroy();

      await pullOneRecord({ isDeleted: false, data: { ...data, updatedAtSyncTick: -1 } });

      const patient = await models.Patient.findByPk(PATIENT_ID);
      expect(patient).not.toBeNull();
      expect(patient.deletedAt).toBeNull();
      expectNotPushable(patient);
      expect(await outgoingPatientIds()).not.toContain(PATIENT_ID);
    });
  });
});
