import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;

describe('resolveDuplicatedPatientDisplayIds', () => {
  let ctx;
  let models;

  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.Setting.set('audit.changes.enabled', true);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  const pushChangesToCentral = async (changes, facilityId) => {
    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: { enabled: true },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });
    await centralSyncManager.updateLookupTable();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);
    await centralSyncManager.addIncomingChanges(sessionId, changes);
    await centralSyncManager.completePush(sessionId, facilityId);
    await waitForPushCompleted(centralSyncManager, sessionId);
    return { centralSyncManager, sessionId };
  };

  it('should rename both patients when displayId collides during sync push', async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const existingPatient = await models.Patient.create(
      fake(models.Patient, { displayId: 'DUP-001' }),
    );
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: existingPatient.id,
      facilityId: facility.id,
    });

    const incomingPatientData = fake(models.Patient, { displayId: 'DUP-001' });
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        isDeleted: false,
        recordType: 'patients',
        recordId: incomingPatientData.id,
        data: incomingPatientData,
      },
    ];

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 15);
    await pushChangesToCentral(changes, facility.id);

    const updatedExisting = await models.Patient.findByPk(existingPatient.id);
    const newPatient = await models.Patient.findByPk(incomingPatientData.id);

    expect(updatedExisting.displayId).toBe('DUP-001_duplicate_1');
    expect(newPatient.displayId).toBe('DUP-001_duplicate_2');
  });

  it('should create a changelog record for the existing patient rename', async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const existingPatient = await models.Patient.create(
      fake(models.Patient, { displayId: 'DUP-002' }),
    );
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: existingPatient.id,
      facilityId: facility.id,
    });

    const incomingPatientData = fake(models.Patient, { displayId: 'DUP-002' });
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        isDeleted: false,
        recordType: 'patients',
        recordId: incomingPatientData.id,
        data: incomingPatientData,
      },
    ];

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 15);
    await pushChangesToCentral(changes, facility.id);

    const changelog = await models.ChangeLog.findOne({
      where: {
        recordId: existingPatient.id,
        tableName: 'patients',
        reason: 'Automated: duplicate displayId resolution during sync',
      },
    });

    expect(changelog).not.toBeNull();
    expect(changelog.updatedByUserId).toBe(SYSTEM_USER_UUID);
    expect(changelog.recordData.displayId).toBe('DUP-002_duplicate_1');
  });

  it('should not modify patients when there is no displayId collision', async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    await models.Patient.create(fake(models.Patient, { displayId: 'UNIQUE-001' }));

    const incomingPatientData = fake(models.Patient, { displayId: 'UNIQUE-002' });
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        isDeleted: false,
        recordType: 'patients',
        recordId: incomingPatientData.id,
        data: incomingPatientData,
      },
    ];

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 15);
    await pushChangesToCentral(changes, facility.id);

    const newPatient = await models.Patient.findByPk(incomingPatientData.id);
    expect(newPatient.displayId).toBe('UNIQUE-002');
  });

  it('should not treat a patient syncing back its own record as a duplicate', async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const existingPatient = await models.Patient.create(
      fake(models.Patient, { displayId: 'SAME-001' }),
    );
    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: existingPatient.id,
      facilityId: facility.id,
    });

    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        isDeleted: false,
        recordType: 'patients',
        recordId: existingPatient.id,
        data: existingPatient.get({ plain: true }),
      },
    ];

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 15);
    await pushChangesToCentral(changes, facility.id);

    const patient = await models.Patient.findByPk(existingPatient.id);
    expect(patient.displayId).toBe('SAME-001');
  });
});
