import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryTypes } from 'sequelize';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

const CONFIG = {
  sync: {
    lookupTable: { enabled: true, avoidRepull: true },
    maxRecordsPerSnapshotChunk: 1000000000,
  },
};

describe('Conflict repro: stale sync_lookup row vs avoid-repull', () => {
  let ctx;
  let models;
  let sequelize;
  let manager;
  let facility;
  const DEVICE_X = 'device-x';
  const DEVICE_Y = 'device-y';

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    vi.resetModules();
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.PatientFacility.truncate({ force: true });
    await models.PatientAdditionalData.truncate({ force: true, cascade: true });
    await models.Patient.truncate({ force: true, cascade: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
    facility = await models.Facility.create(fake(models.Facility));
    manager = await initializeCentralSyncManagerWithContext(ctx, CONFIG);
  });

  const lookupRow = async recordId => {
    const rows = await sequelize.query(
      `SELECT record_id, record_type, data, pushed_by_device_id, updated_at_sync_tick
       FROM sync_lookup WHERE record_id = :recordId`,
      { replacements: { recordId }, type: QueryTypes.SELECT },
    );
    return rows[0];
  };

  const describeRows = (rows, field, recordId) =>
    rows
      .filter(r => r.recordId === recordId)
      .map(r => ({
        recordId: r.recordId,
        [field]: r.data[field],
        savedAtSyncTick: r.savedAtSyncTick,
      }));

  const startSession = async deviceId => {
    const { sessionId } = await manager.startSession({ deviceId, facilityIds: [facility.id] });
    await waitForSession(manager, sessionId);
    return sessionId;
  };

  const push = async (sessionId, deviceId, recordType, recordId, data) => {
    await manager.addIncomingChanges(sessionId, [
      { direction: SYNC_SESSION_DIRECTION.OUTGOING, isDeleted: false, recordType, recordId, data },
    ]);
    await manager.completePush(sessionId, deviceId);
    await waitForPushCompleted(manager, sessionId);
  };

  const pull = async (sessionId, deviceId, since) => {
    await manager.setupSnapshotForPull(
      sessionId,
      { since, facilityIds: [facility.id], deviceId },
      () => true,
    );
    const changes = await manager.getOutgoingChanges(sessionId, { limit: 1000 });
    const { pullUntil } = await manager.fetchPullMetadata(sessionId);
    return { changes, pullUntil };
  };

  // Steps 1 and the initial pull by X: returns X's cursor
  const setupPatient = async () => {
    const patient = await models.Patient.create({ ...fake(models.Patient), firstName: 'Original' });
    await models.PatientFacility.create({ patientId: patient.id, facilityId: facility.id });
    await manager.updateLookupTable();
    const s0 = await startSession(DEVICE_X);
    const { pullUntil } = await pull(s0, DEVICE_X, -1);
    return { patient, cursorX: pullUntil };
  };

  const updateLookupAndLog = async (recordId, label) => {
    await manager.updateLookupTable();
    const row = await lookupRow(recordId);
    console.log(
      `[repro] ${label}: lookup row firstName=${row?.data?.firstName} pushed_by=${row?.pushed_by_device_id} tick=${row?.updated_at_sync_tick}`,
    );
    return row;
  };

  const runScenario = async ({ viaPushFromY, refreshBeforeStep4 }) => {
    const { patient, cursorX } = await setupPatient();
    console.log(`[repro] X cursor after initial pull = ${cursorX}`);

    // Step 2: someone else changes R, lookup refreshed
    if (viaPushFromY) {
      const sy = await startSession(DEVICE_Y);
      await push(sy, DEVICE_Y, 'patients', patient.id, {
        ...patient.dataValues,
        firstName: 'VersionY',
      });
      await manager.endSession(sy);
    } else {
      await models.Patient.update({ firstName: 'VersionY' }, { where: { id: patient.id } });
    }
    await updateLookupAndLog(patient.id, 'after step 2 (version Y)');

    // Step 3: X pushes version X
    const sx = await startSession(DEVICE_X);
    await push(sx, DEVICE_X, 'patients', patient.id, {
      ...patient.dataValues,
      firstName: 'VersionX',
    });
    await patient.reload();
    const deviceTick = await models.SyncDeviceTick.findByPk(patient.updatedAtSyncTick);
    console.log(
      `[repro] after step 3: central firstName=${patient.firstName} updatedAtSyncTick=${patient.updatedAtSyncTick} deviceTick.deviceId=${deviceTick?.deviceId}`,
    );

    if (refreshBeforeStep4) await updateLookupAndLog(patient.id, 'control refresh before step 4');

    // Step 4: same session pull
    const step4 = await pull(sx, DEVICE_X, cursorX);
    const step4Rows = describeRows(step4.changes, 'firstName', patient.id);
    console.log(`[repro] step 4 snapshot rows for R: ${JSON.stringify(step4Rows)}`);
    await manager.endSession(sx);

    // Step 5
    const lookupAfter = await updateLookupAndLog(patient.id, 'after step 5 refresh');

    // Step 6: new session, new cursor
    const s6 = await startSession(DEVICE_X);
    const step6 = await pull(s6, DEVICE_X, step4.pullUntil);
    const step6Rows = describeRows(step6.changes, 'firstName', patient.id);
    console.log(
      `[repro] step 6 (since=${step4.pullUntil}) snapshot rows for R: ${JSON.stringify(step6Rows)}`,
    );
    return { step4Rows, step6Rows, lookupAfter, patient };
  };

  it('(a) direct central edit: X receives stale version Y in step 4 and nothing in step 6', async () => {
    const { step4Rows, step6Rows, lookupAfter } = await runScenario({
      viaPushFromY: false,
      refreshBeforeStep4: false,
    });
    expect(step4Rows.map(r => r.firstName)).toEqual(['VersionY']);
    expect(lookupAfter.data.firstName).toBe('VersionX');
    expect(lookupAfter.pushed_by_device_id).toBe(DEVICE_X);
    expect(step6Rows).toEqual([]);
  });

  it('(b) push from device Y: X receives stale version Y in step 4 and nothing in step 6', async () => {
    const { step4Rows, step6Rows, lookupAfter } = await runScenario({
      viaPushFromY: true,
      refreshBeforeStep4: false,
    });
    expect(step4Rows.map(r => r.firstName)).toEqual(['VersionY']);
    expect(lookupAfter.data.firstName).toBe('VersionX');
    expect(lookupAfter.pushed_by_device_id).toBe(DEVICE_X);
    expect(step6Rows).toEqual([]);
  });

  it('(control) lookup refreshed between steps 3 and 4: step 4 has no row for R', async () => {
    const { step4Rows } = await runScenario({ viaPushFromY: false, refreshBeforeStep4: true });
    expect(step4Rows).toEqual([]);
  });

  it('(PAD) field-level merge: does X ever receive the merged row?', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    await models.PatientFacility.create({ patientId: patient.id, facilityId: facility.id });
    const pad = await models.PatientAdditionalData.create({
      ...fake(models.PatientAdditionalData),
      patientId: patient.id,
      passport: 'orig-passport',
      birthCertificate: 'orig-bc',
      updatedAtByField: {},
    });
    await manager.updateLookupTable();
    const s0 = await startSession(DEVICE_X);
    const { pullUntil: cursorX } = await pull(s0, DEVICE_X, -1);
    const show = rows =>
      rows
        .filter(r => r.recordId === pad.id)
        .map(r => ({
          passport: r.data.passport,
          birthCertificate: r.data.birthCertificate,
          savedAtSyncTick: r.savedAtSyncTick,
        }));

    // Y changes passport only
    const sy = await startSession(DEVICE_Y);
    await push(sy, DEVICE_Y, 'patient_additional_data', pad.id, {
      ...pad.dataValues,
      passport: 'Y-passport',
      updatedAtByField: { passport: 5000 },
    });
    await manager.endSession(sy);
    await manager.updateLookupTable();

    // X changes birthCertificate only (passport untouched on X, so no field tick)
    const sx = await startSession(DEVICE_X);
    await push(sx, DEVICE_X, 'patient_additional_data', pad.id, {
      ...pad.dataValues,
      birthCertificate: 'X-bc',
      updatedAtByField: { birth_certificate: 6000 },
    });
    await pad.reload();
    console.log(
      `[repro-pad] central after merge: passport=${pad.passport} birthCertificate=${pad.birthCertificate}`,
    );
    const step4 = await pull(sx, DEVICE_X, cursorX);
    console.log(`[repro-pad] step 4 rows: ${JSON.stringify(show(step4.changes))}`);
    await manager.endSession(sx);

    await manager.updateLookupTable();
    const row = await lookupRow(pad.id);
    console.log(
      `[repro-pad] lookup after refresh: passport=${row.data.passport} bc=${row.data.birthCertificate} pushed_by=${row.pushed_by_device_id} tick=${row.updated_at_sync_tick}`,
    );
    const s6 = await startSession(DEVICE_X);
    const step6 = await pull(s6, DEVICE_X, step4.pullUntil);
    console.log(`[repro-pad] step 6 rows: ${JSON.stringify(show(step6.changes))}`);
    expect(pad.passport).toBe('Y-passport');
  });
});
