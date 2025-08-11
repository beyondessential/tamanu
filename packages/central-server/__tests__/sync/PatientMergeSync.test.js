import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LOOKUP_UP_TO_TICK,
  NOTE_RECORD_TYPES,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { fake, fakeUser } from '@tamanu/fake-data/fake';

import { makeTwoPatients } from '../admin/patientMerge/makeTwoPatients';
import { mergePatient } from '../../app/admin/patientMerge/mergePatient';
import { createTestContext } from '../utilities';
import { CentralSyncManager } from '../../dist/sync/CentralSyncManager';

jest.mock('config', () => ({
  ...jest.requireActual('config'),
  sync: {
    ...jest.requireActual('config').sync,
    lookupTable: {
      enabled: true,
    },
    maxRecordsPerSnapshotChunk: 1000000000,
  },
}));

describe('Sync Patient Merge', () => {
  let ctx;
  let models;
  let keep, merge, facility, mergeEnc, mergeEnc2, examiner;

  const setupMergeData = async () => {
    const { Encounter, Facility, Department, Location, User, PatientFacility, LocalSystemFact } =
      models;
    const OLD_SYNC_TICK = '2';
    const LOOKUP_UP_TO_TICK = '1';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
    await LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, LOOKUP_UP_TO_TICK);

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

    examiner = await User.create(fakeUser());

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
    await models.SyncLookup.truncate({ cascade: true, force: true });
    await models.SyncLookupTick.truncate({ cascade: true, force: true });
  });

  it('pulls child records (notes and lab requests) of merged encounters after merging patients', async () => {
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

    const labRequest = await models.LabRequest.create({
      ...fake(models.LabRequest),
      encounterId: mergeEnc.id,
      status: LAB_REQUEST_STATUSES.PUBLISHED,
      requestedById: examiner.id,
    });

    const centralSyncManager = new CentralSyncManager(ctx);
    const { sessionId } = await centralSyncManager.startSession();

    // update lookup table for pre-merge data.
    await centralSyncManager.updateLookupTable();

    const NEW_SYNC_TICK = '10';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    await mergePatient(models, keep.id, merge.id);

    // update lookup table for post-merge data
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

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const notes = changes.filter(c => c.recordType === 'notes');
    expect(notes).toHaveLength(2);
    expect(notes.map(n => n.recordId).sort()).toEqual([note.id, note2.id].sort());

    const labRequests = changes.filter(c => c.recordType === 'lab_requests');
    expect(labRequests).toHaveLength(1);
    expect(labRequests[0].recordId).toEqual(labRequest.id);
  });

  it('pulls child records (notes) of merged patient_care_plans after merging patients', async () => {
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

    const centralSyncManager = new CentralSyncManager(ctx);
    const { sessionId } = await centralSyncManager.startSession();

    // update lookup table for pre-merge data
    await centralSyncManager.updateLookupTable();

    const NEW_SYNC_TICK = '10';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    await mergePatient(models, keep.id, merge.id);

    // update lookup table for post-merge data
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

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const notes = changes.filter(c => c.recordType === 'notes');
    expect(notes).toHaveLength(2);
    expect(notes.map(n => n.recordId).sort()).toEqual([note.id, note2.id].sort());
  });

  it('pulls child records (contributing_death_causes) of merged patient_death_data after merging patients', async () => {
    const { LocalSystemFact, ReferenceData } = models;

    await setupMergeData();

    const patientDeathData = await models.PatientDeathData.create({
      ...fake(models.PatientDeathData),
      clinicianId: examiner.id,
      patientId: merge.id,
    });

    const referenceData = await ReferenceData.create(fake(ReferenceData));

    const contributingDeathCause = await models.ContributingDeathCause.create({
      ...fake(models.ContributingDeathCause),
      patientDeathDataId: patientDeathData.id,
      conditionId: referenceData.id,
    });

    const centralSyncManager = new CentralSyncManager(ctx);
    const { sessionId } = await centralSyncManager.startSession();

    // update lookup table for pre-merge data
    await centralSyncManager.updateLookupTable();

    const NEW_SYNC_TICK = '10';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    await mergePatient(models, keep.id, merge.id);

    // update lookup table for post-merge data
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

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const contributingDeathCauses = changes.filter(
      c => c.recordType === 'contributing_death_causes',
    );
    expect(contributingDeathCauses).toHaveLength(1);
    expect(contributingDeathCauses[0].recordId).toEqual(contributingDeathCause.id);
  });

  it('does not pull child records (notes) of merged encounters after merging patients IF feature flag is false', async () => {
    const { LocalSystemFact } = models;

    await setupMergeData();

    await models.Note.create({
      ...fake(models.Note),
      recordId: mergeEnc.id,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    });
    await models.Note.create({
      ...fake(models.Note),
      recordId: mergeEnc2.id,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    });

    const centralSyncManager = new CentralSyncManager(ctx);
    const { sessionId } = await centralSyncManager.startSession();

    // update lookup table for pre-merge data
    await centralSyncManager.updateLookupTable();

    const NEW_SYNC_TICK = '10';
    await LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    await mergePatient(models, keep.id, merge.id, false);

    // update lookup table for post-merge data
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

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const notes = changes.filter(c => c.recordType === 'notes');

    expect(notes).toHaveLength(0);
  });
});
