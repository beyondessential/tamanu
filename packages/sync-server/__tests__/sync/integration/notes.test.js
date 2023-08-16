import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';
import { fake, fakeUser } from 'shared/test-helpers/fake';
import { createDummyEncounter } from 'shared/demoData/patients';
import { sleepAsync } from 'shared/utils/sleepAsync';
import { IMAGING_TYPES, LAB_REQUEST_STATUSES, NOTE_TYPES } from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import { CentralSyncManager } from '../../../app/sync/CentralSyncManager';
import { NOTE_RECORD_TYPES } from '../../../../shared/src/constants';

const waitForSession = async (centralSyncManager, sessionId) => {
  let ready = false;
  while (!ready) {
    ready = await centralSyncManager.checkSessionReady(sessionId);
    await sleepAsync(100);
  }
};

describe('CentralSyncManager', () => {
  let ctx;
  let models;
  let centralSyncManager;
  let patient;
  let location;
  let department;
  let facility;
  let user;

  const OLD_SYNC_TICK = 10;
  const NEW_SYNC_TICK = 20;

  const DEFAULT_CURRENT_SYNC_TIME_VALUE = 2;

  const createEncounters = async (patientId, numberOfEncounters) => {
    return Promise.all(
      [...Array(numberOfEncounters).keys()].map(async () =>
        models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId,
        }),
      ),
    );
  };

  const createNotesOfRecordsWithPatientViaEncounter = async encounters => {
    const [encounter1, encounter2, encounter3] = encounters;

    // work around as Triage.create needs config.facilityId which is not available in central
    const [triage] = await models.Triage.upsert({
      encounterId: encounter1.id,
      patientId: patient.id,
      departmentId: department.id,
      facilityId: facility.id,
    });
    const triageNote = await triage.createNote({
      noteType: NOTE_TYPES.OTHER,
      content: 'triageNote',
      authorId: user.id,
    });

    const labRequest = await models.LabRequest.create({
      patientId: patient.id,
      encounterId: encounter2.id,
      status: LAB_REQUEST_STATUSES.PENDING,
    });
    const labRequestNote = await labRequest.createNote({
      noteType: NOTE_TYPES.OTHER,
      content: 'labRequestNote',
      authorId: user.id,
    });

    const imagingRequest = await models.ImagingRequest.create({
      encounterId: encounter3.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: user.id,
    });
    const imagingNote = await imagingRequest.createNote({
      noteType: NOTE_TYPES.OTHER,
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
    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, DEFAULT_CURRENT_SYNC_TIME_VALUE);
    await models.Note.truncate({ cascade: true, force: true });
    await models.PatientFacility.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  it('returns all notes of record types associated with encounters of marked-for-sync patients', async () => {
    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, OLD_SYNC_TICK);

    const encounters = await createEncounters(patient.id, 3);

    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, NEW_SYNC_TICK);

    const [
      triageNote,
      labRequestNote,
      imagingNote,
    ] = await createNotesOfRecordsWithPatientViaEncounter(encounters);

    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 15,
        facilityId: facility.id,
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
    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, OLD_SYNC_TICK);

    const [encounter1, encounter2, encounter3] = await createEncounters(patient.id, 3);

    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, NEW_SYNC_TICK);

    const encounter1Note = await encounter1.createNote({
      noteType: NOTE_TYPES.OTHER,
      content: 'encounter1Note',
      authorId: user.id,
    });
    const encounter2Note = await encounter2.createNote({
      noteType: NOTE_TYPES.OTHER,
      content: 'encounter2Note',
      authorId: user.id,
    });
    const encounter3Note = await encounter3.createNote({
      noteType: NOTE_TYPES.OTHER,
      content: 'encounter3Note',
      authorId: user.id,
    });

    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 15,
        facilityId: facility.id,
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
    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, OLD_SYNC_TICK);

    const encounters = await createEncounters(patient.id, 3);
    const [encounter1] = encounters;

    await models.PatientFacility.create({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });

    await encounter1.createNote({
      noteType: NOTE_TYPES.OTHER,
      content: 'encounter1Note',
      authorId: user.id,
    });
    await createNotesOfRecordsWithPatientViaEncounter(encounters);

    await models.LocalSystemFact.set(CURRENT_SYNC_TIME_KEY, NEW_SYNC_TICK);

    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 15,
        facilityId: facility.id,
      },
      () => true,
    );

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const notes = outgoingChanges.filter(c => c.recordType === 'notes');

    expect(notes).toHaveLength(0);
  });
});
