import { FACT_CURRENT_SYNC_TICK, NOTE_RECORD_TYPES } from '@tamanu/constants';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { makeTwoPatients } from '../admin/patientMerge/makeTwoPatients';
import { mergePatient } from '../../app/admin/patientMerge/mergePatient';
import { createTestContext } from '../utilities';

describe('Patient Merge Sync', () => {
  let ctx;
  let models;
  let keep, merge, facility, mergeEnc, mergeEnc2;

  const DEFAULT_CONFIG = {
    sync: {
      lookupTable: {
        enabled: false,
      },
      maxRecordsPerSnapshotChunk: 1000000000,
    },
  };

  const initializeCentralSyncManager = (config) => {
    // Have to load test function within test scope so that we can mock dependencies per test case
    const {
      CentralSyncManager: TestCentralSyncManager,
    } = require('../../dist/sync/CentralSyncManager');

    TestCentralSyncManager.overrideConfig(config || DEFAULT_CONFIG);

    return new TestCentralSyncManager(ctx);
  };

  const setupMergeData = async () => {
    const { Encounter, Facility, Department, Location, User, PatientFacility, LocalSystemFact } =
      models;
    const OLD_SYNC_TICK = '1';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);

    [keep, merge] = await makeTwoPatients(models);

    facility = await Facility.create({
      ...fake(Facility),
      name: 'Utopia HQ',
    });

    const location = await Location.create({
      ...fake(Location),
      facilityId: facility.id,
    });

    const department = await Department.create({
      ...fake(Department),
      facilityId: facility.id,
    });

    const examiner = await User.create(fakeUser());

    const baseEncounter = {
      locationId: location.id,
      departmentId: department.id,
      examinerId: examiner.id,
    };

    mergeEnc = await models.Encounter.create({
      ...fake(Encounter),
      ...baseEncounter,
      patientId: merge.id,
    });
    mergeEnc2 = await models.Encounter.create({
      ...fake(Encounter),
      ...baseEncounter,
      patientId: merge.id,
    });
    await models.Encounter.create({
      ...fake(Encounter),
      ...baseEncounter,
      patientId: keep.id, // keep encounter
    });

    await PatientFacility.upsert({
      id: PatientFacility.generateId(),
      patientId: keep.id,
      facilityId: facility.id,
    });
    await PatientFacility.upsert({
      id: PatientFacility.generateId(),
      patientId: merge.id,
      facilityId: facility.id,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Facility.truncate({ cascade: true, force: true });
    await models.PatientFacility.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
    await models.Note.truncate({ cascade: true, force: true });
    await models.Patient.truncate({ cascade: true, force: true });
    await models.LocalSystemFact.truncate({ cascade: true, force: true });
    await models.Department.truncate({ cascade: true, force: true });
    await models.Location.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
  });

  it('should refresh notes of encounters for sync', async () => {
    const { LocalSystemFact } = models;

    await setupMergeData();

    const note = await models.Note.create({
      ...fake(models.Note),
      recordId: mergeEnc.id,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    });
    const note2 = await models.Note.create({
      ...fake(models.Note),
      recordId: mergeEnc2.id,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    });

    const NEW_SYNC_TICK = '4';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    await mergePatient(models, keep.id, merge.id);

    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();

    await centralSyncManager.updateLookupTable();

    // Start the snapshot for pull process
    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: NEW_SYNC_TICK - 1, // get all changes since the last sync tick
        facilityIds: [facility.id],
        deviceId: facility.id,
      },
      () => true,
    );

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
      limit: 10,
    });
    const notes = changes.filter((c) => c.recordType === 'notes');
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.recordId).sort()).toEqual([note.id, note2.id].sort());
  });

  it('should refresh notes of patient_care_plans for sync', async () => {
    const { LocalSystemFact } = models;

    await setupMergeData();

    const patientCarePlan = await models.PatientCarePlan.create({
      ...fake(models.PatientCarePlan),
      patientId: merge.id,
    });

    const note = await models.Note.create({
      ...fake(models.Note),
      recordId: patientCarePlan.id,
      recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
    });
    const note2 = await models.Note.create({
      ...fake(models.Note),
      recordId: patientCarePlan.id,
      recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
    });

    const NEW_SYNC_TICK = '4';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    await mergePatient(models, keep.id, merge.id);

    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();

    await centralSyncManager.updateLookupTable();

    // Start the snapshot for pull process
    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: NEW_SYNC_TICK - 1, // get all changes since the last sync tick
        facilityIds: [facility.id],
        deviceId: facility.id,
      },
      () => true,
    );

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
      limit: 10,
    });
    const notes = changes.filter((c) => c.recordType === 'notes');
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.recordId).sort()).toEqual([note.id, note2.id].sort());
  });

  it('should refresh contributing_death_causes of patient_death_data for sync', async () => {
    const { LocalSystemFact, User, ReferenceData } = models;

    await setupMergeData();

    const clinician = await User.create(fakeUser());

    const patientDeathData = await models.PatientDeathData.create({
      ...fake(models.PatientDeathData),
      clinicianId: clinician.id,
      patientId: merge.id,
    });

    const referenceData = await ReferenceData.create(fake(ReferenceData));

    const contributingDeathCause = await models.ContributingDeathCause.create({
      ...fake(models.ContributingDeathCause),
      patientDeathDataId: patientDeathData.id,
      conditionId: referenceData.id,
    });

    const NEW_SYNC_TICK = '4';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    await mergePatient(models, keep.id, merge.id);

    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();

    await centralSyncManager.updateLookupTable();

    // Start the snapshot for pull process
    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: NEW_SYNC_TICK - 1, // get all changes since the last sync tick
        facilityIds: [facility.id],
        deviceId: facility.id,
      },
      () => true,
    );

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {
      limit: 10,
    });
    const contributingDeathCauses = changes.filter(
      (c) => c.recordType === 'contributing_death_causes',
    );
    expect(contributingDeathCauses).toHaveLength(1);
    expect(contributingDeathCauses[0].recordId).toEqual(contributingDeathCause.id);
  });
});
