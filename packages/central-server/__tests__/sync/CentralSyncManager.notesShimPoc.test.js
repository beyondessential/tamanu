// Proof of concept: a facility running a version older than migration
// 1759894448776-migrateNoteTypesToReferenceData (~v2.41) can sync notes with a
// current central. The facility declares wireSchemaVersion=0; the shim chain
// translates the wire shape on push (upcast) and pull (downcast).
//
// Requires the same dist build + test DB infrastructure as other CentralSyncManager
// tests in this directory (`npm run build-shared` + a Postgres test database).

import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LOOKUP_UP_TO_TICK,
  NOTE_RECORD_TYPES,
  SYSTEM_USER_UUID,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake, fakeUser } from '@tamanu/fake-data/fake';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

// The 16 deterministic note-type reference_data rows the migration creates.
// We have to insert them ourselves because beforeEach truncates ReferenceData,
// and the migration itself isn't re-run between tests.
const NOTE_TYPE_REFERENCE_DATA = [
  { id: 'notetype-treatmentPlan', code: 'treatmentPlan', name: 'Treatment plan' },
  { id: 'notetype-discharge', code: 'discharge', name: 'Discharge planning' },
  { id: 'notetype-clinicalMobile', code: 'clinicalMobile', name: 'Clinical note (mobile)' },
  { id: 'notetype-handover', code: 'handover', name: 'Handover note' },
  { id: 'notetype-areaToBeImaged', code: 'areaToBeImaged', name: 'Area to be imaged' },
  { id: 'notetype-resultDescription', code: 'resultDescription', name: 'Result description' },
  { id: 'notetype-other', code: 'other', name: 'Other' },
  { id: 'notetype-system', code: 'system', name: 'System' },
  { id: 'notetype-admission', code: 'admission', name: 'Admission' },
  { id: 'notetype-medical', code: 'medical', name: 'Medical' },
  { id: 'notetype-surgical', code: 'surgical', name: 'Surgical' },
  { id: 'notetype-nursing', code: 'nursing', name: 'Nursing' },
  { id: 'notetype-dietary', code: 'dietary', name: 'Dietary' },
  { id: 'notetype-pharmacy', code: 'pharmacy', name: 'Pharmacy' },
  { id: 'notetype-physiotherapy', code: 'physiotherapy', name: 'Physiotherapy' },
  { id: 'notetype-social', code: 'social', name: 'Social welfare' },
];

describe('CentralSyncManager notes shim PoC (pre-migrateNoteTypesToReferenceData skew)', () => {
  let ctx;
  let models;
  let facility;
  let patient;
  let encounter;
  let examiner;

  const initializeCentralSyncManager = config => initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    jest.resetModules();
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Note.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
    await models.Patient.truncate({ cascade: true, force: true });
    await models.PatientFacility.truncate({ cascade: true, force: true });
    await models.Location.truncate({ cascade: true, force: true });
    await models.Department.truncate({ cascade: true, force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.Setting.set('audit.changes.enabled', false);
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });

    // The migration creates these synchronously. Replicate that for tests.
    for (const noteType of NOTE_TYPE_REFERENCE_DATA) {
      await models.ReferenceData.create({
        id: noteType.id,
        type: REFERENCE_TYPES.NOTE_TYPE,
        code: noteType.code,
        name: noteType.name,
      });
    }

    facility = await models.Facility.create(fake(models.Facility));
    const department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    const location = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
    });
    examiner = await models.User.create(fakeUser());
    patient = await models.Patient.create(fake(models.Patient));
    encounter = await models.Encounter.create({
      ...fake(models.Encounter),
      departmentId: department.id,
      locationId: location.id,
      examinerId: examiner.id,
      patientId: patient.id,
    });
    await models.PatientFacility.upsert({
      id: models.PatientFacility.generateId(),
      patientId: patient.id,
      facilityId: facility.id,
    });
  });

  it('upcasts a pre-migration note push (noteType -> noteTypeId)', async () => {
    const centralSyncManager = initializeCentralSyncManager();

    // The old facility opens the session declaring its older wire-schema version.
    const { sessionId } = await centralSyncManager.startSession({
      facilityIds: [facility.id],
      wireSchemaVersion: 0,
    });
    await waitForSession(centralSyncManager, sessionId);

    // Old facility pushes a note record using the pre-migration field name.
    const noteId = 'note-poc-001';
    await centralSyncManager.addIncomingChanges(sessionId, [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'notes',
        recordId: noteId,
        data: {
          id: noteId,
          recordId: encounter.id,
          recordType: NOTE_RECORD_TYPES.ENCOUNTER,
          date: '2025-01-15 09:30:00',
          content: 'A note created on an old facility before the note-type FK migration',
          noteType: 'treatmentPlan',
          authorId: examiner.id,
          updatedAtSyncTick: 2,
        },
      },
    ]);

    await centralSyncManager.completePush(sessionId, facility.id, ['notes']);
    await waitForPushCompleted(centralSyncManager, sessionId);

    // The shim should have translated the pushed record so the canonical FK column
    // is populated; the old `note_type` column doesn't exist on central post-migration.
    const persisted = await models.Note.findByPk(noteId);
    expect(persisted).not.toBeNull();
    expect(persisted.noteTypeId).toBe('notetype-treatmentPlan');
    expect(persisted.content).toBe(
      'A note created on an old facility before the note-type FK migration',
    );
  });

  it('falls back to notetype-other when the old facility pushes an unknown code', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession({
      facilityIds: [facility.id],
      wireSchemaVersion: 0,
    });
    await waitForSession(centralSyncManager, sessionId);

    const noteId = 'note-poc-002';
    await centralSyncManager.addIncomingChanges(sessionId, [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'notes',
        recordId: noteId,
        data: {
          id: noteId,
          recordId: encounter.id,
          recordType: NOTE_RECORD_TYPES.ENCOUNTER,
          date: '2025-01-15 09:30:00',
          content: 'unknown note type',
          // a code the migration didn't anticipate
          noteType: 'forkedCustomType',
          authorId: examiner.id,
          updatedAtSyncTick: 2,
        },
      },
    ]);
    await centralSyncManager.completePush(sessionId, facility.id, ['notes']);
    await waitForPushCompleted(centralSyncManager, sessionId);

    const persisted = await models.Note.findByPk(noteId);
    expect(persisted).not.toBeNull();
    expect(persisted.noteTypeId).toBe('notetype-other');
  });

  it('downcasts an outgoing note pull (noteTypeId -> noteType) for an old facility', async () => {
    const noteId = 'note-poc-003';
    await models.Note.create({
      id: noteId,
      recordId: encounter.id,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      date: '2025-01-15 09:30:00',
      content: 'A note created on central in the new shape',
      noteTypeId: 'notetype-discharge',
      authorId: examiner.id,
    });

    const centralSyncManager = initializeCentralSyncManager();
    await centralSyncManager.updateLookupTable();

    const { sessionId } = await centralSyncManager.startSession({
      facilityIds: [facility.id],
      wireSchemaVersion: 0,
    });
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 0,
        facilityIds: [facility.id],
        deviceId: facility.id,
      },
      () => true,
    );

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const noteChange = changes.find(c => c.recordType === 'notes' && c.recordId === noteId);
    expect(noteChange).toBeDefined();
    // The downcast translates the FK id back to the old enum code and removes noteTypeId
    // so an old facility receives a record its model understands.
    expect(noteChange.data.noteType).toBe('discharge');
    expect(noteChange.data).not.toHaveProperty('noteTypeId');
  });

  it('does not downcast when the session declares the current wire-schema (idempotency check)', async () => {
    const noteId = 'note-poc-004';
    await models.Note.create({
      id: noteId,
      recordId: encounter.id,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      date: '2025-01-15 09:30:00',
      content: 'Should pass through unchanged for current facility',
      noteTypeId: 'notetype-medical',
      authorId: examiner.id,
    });

    const centralSyncManager = initializeCentralSyncManager();
    await centralSyncManager.updateLookupTable();

    // A current-version facility — declares wireSchemaVersion=1 (the current).
    const { sessionId } = await centralSyncManager.startSession({
      facilityIds: [facility.id],
      wireSchemaVersion: 1,
    });
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 0,
        facilityIds: [facility.id],
        deviceId: facility.id,
      },
      () => true,
    );

    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {});
    const noteChange = changes.find(c => c.recordType === 'notes' && c.recordId === noteId);
    expect(noteChange).toBeDefined();
    expect(noteChange.data.noteTypeId).toBe('notetype-medical');
    expect(noteChange.data).not.toHaveProperty('noteType');
  });
});
