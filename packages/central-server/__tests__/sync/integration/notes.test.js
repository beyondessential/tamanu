import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createDummyEncounter } from '@tamanu/database/demoData/patients';
import {
  IMAGING_TYPES,
  LAB_REQUEST_STATUSES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
} from '@tamanu/constants';

import { createTestContext, waitForSession } from '../../utilities';
import { CentralSyncManager } from '../../../dist/sync/CentralSyncManager';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

describe('CentralSyncManager', () => {
  let ctx;
  let models;
  let centralSyncManager;
  let patient;
  let department;
  let location;
  let facility;
  let user;

  const OLD_SYNC_TICK = 10;
  const NEW_SYNC_TICK = 20;

  const createEncounters = async (patientId, numberOfEncounters) => {
    return Promise.all(
      [...Array(numberOfEncounters).keys()].map(async () =>
        models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId,
          endDate: getCurrentDateTimeString(),
        }),
      ),
    );
  };

  const createNotesOfRecordsWithPatientViaEncounter = async encounters => {
    const [encounter1, encounter2] = encounters;

    const triage = await models.Triage.create({
      patientId: patient.id,
      departmentId: department.id,
      locationId: location.id,
      facilityId: facility.id,
      practitionerId: user.id,
      triageTime: getCurrentDateTimeString(),
    });
    const triageNote = await triage.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      content: 'triageNote',
      authorId: user.id,
    });

    const labRequest = await models.LabRequest.create({
      patientId: patient.id,
      encounterId: encounter1.id,
      status: LAB_REQUEST_STATUSES.PENDING,
    });
    const labRequestNote = await labRequest.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      content: 'labRequestNote',
      authorId: user.id,
    });

    const imagingRequest = await models.ImagingRequest.create({
      encounterId: encounter2.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: user.id,
    });
    const imagingNote = await imagingRequest.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      content: 'imagingNote',
      authorId: user.id,
    });

    return [triageNote, labRequestNote, imagingNote];
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);

    centralSyncManager = new CentralSyncManager(ctx);

    patient = await models.Patient.create({
      ...fake(models.Patient),
    });
    facility = await models.Facility.create({
      ...fake(models.Facility),
    });
    user = await models.User.create(fakeUser());
    department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    location = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
    });
    await models.ReferenceData.create({
      id: 'test-arrival-mode-id',
      type: 'arrivalMode',
      code: 'test-arrival-mode-id',
      name: 'Test arrival mode',
    });
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.Note.truncate({ cascade: true, force: true });
    await models.PatientFacility.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    await models.Encounter.truncate({ cascade: true, force: true });
  });

  it('returns all notes of record types associated with encounters of marked-for-sync patients', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);

    const encounters = await createEncounters(patient.id, 3);

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    const [triageNote, labRequestNote, imagingNote] =
      await createNotesOfRecordsWithPatientViaEncounter(encounters);

    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 15,
        facilityIds: [facility.id],
      },
      () => true,
    );

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const notes = outgoingChanges.filter(c => c.recordType === 'notes');

    expect(notes.find(c => c.data.recordType === NOTE_RECORD_TYPES.TRIAGE)?.recordId).toEqual(
      triageNote.id,
    );
    expect(
      notes.find(c => c.data.recordType === NOTE_RECORD_TYPES.IMAGING_REQUEST)?.recordId,
    ).toEqual(imagingNote.id);
    expect(notes.find(c => c.data.recordType === NOTE_RECORD_TYPES.LAB_REQUEST)?.recordId).toEqual(
      labRequestNote.id,
    );
  });

  it('returns all notes of encounters of marked-for-sync patients', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);

    const [encounter1, encounter2, encounter3] = await createEncounters(patient.id, 3);

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    const encounter1Note = await encounter1.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      content: 'encounter1Note',
      authorId: user.id,
    });
    const encounter2Note = await encounter2.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      content: 'encounter2Note',
      authorId: user.id,
    });
    const encounter3Note = await encounter3.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      content: 'encounter3Note',
      authorId: user.id,
    });

    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 15,
        facilityIds: [facility.id],
      },
      () => true,
    );

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const notes = outgoingChanges.filter(c => c.recordType === 'notes');

    expect(notes.find(c => c.data.recordId === encounter1.id)).toHaveProperty(
      'recordId',
      encounter1Note.id,
    );
    expect(notes.find(c => c.data.recordId === encounter2.id)).toHaveProperty(
      'recordId',
      encounter2Note.id,
    );
    expect(notes.find(c => c.data.recordId === encounter3.id)).toHaveProperty(
      'recordId',
      encounter3Note.id,
    );
  });

  it("does not return notes created before 'since' sync tick", async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);

    const encounters = await createEncounters(patient.id, 3);
    const [encounter1] = encounters;

    await encounter1.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      content: 'encounter1Note',
      authorId: user.id,
    });
    await createNotesOfRecordsWithPatientViaEncounter(encounters);

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 15,
        facilityIds: [facility.id],
      },
      () => true,
    );

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const notes = outgoingChanges.filter(c => c.recordType === 'notes');

    expect(notes).toHaveLength(0);
  });
});
