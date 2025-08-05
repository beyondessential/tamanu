import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createDummyEncounter } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';
import { initializeCentralSyncManager, waitForSession } from './CentralSyncManager.utils';

describe('CentralSyncManager.setupSnapshotForPull', () => {
  let ctx;
  let models;

  beforeEach(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe('handles snapshot process', () => {
    it('returns all encounters for newly marked-for-sync patients', async () => {
      const OLD_SYNC_TICK = 10;
      const NEW_SYNC_TICK = 20;

      // ~ ~ ~ Set up old data
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
      const patient1 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const patient2 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const patient3 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const thisFacility = await models.Facility.create({
        ...fake(models.Facility),
      });
      const otherFacility = await models.Facility.create({
        ...fake(models.Facility),
      });
      await models.User.create(fakeUser());
      await models.Department.create({
        ...fake(models.Department),
        facilityId: otherFacility.id,
      });
      await models.Location.create({
        ...fake(models.Location),
        facilityId: otherFacility.id,
      });
      const encounter1 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient1.id,
      });
      const encounter2 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient2.id,
      });
      const encounter3 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient3.id,
      });

      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

      // ~ ~ ~ Set up data for marked for sync patients
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient1.id,
        facilityId: thisFacility.id,
      });
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient2.id,
        facilityId: thisFacility.id,
      });

      const centralSyncManager = initializeCentralSyncManager(ctx);
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 15,
          facilityIds: [thisFacility.id],
        },
        () => true,
      );

      const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
      const encounterIds = outgoingChanges
        .filter(c => c.recordType === 'encounters')
        .map(c => c.recordId);

      // Assert if outgoing changes contain the encounters (fully) for the marked for sync patients
      expect(encounterIds).toEqual(expect.arrayContaining([encounter1.id, encounter2.id]));
      expect(encounterIds).not.toEqual(expect.arrayContaining([encounter3.id]));
    });

    it('returns all encounters for newly marked-for-sync patients across multiple facilities', async () => {
      const OLD_SYNC_TICK = 20;
      const NEW_SYNC_TICK = 30;

      // ~ ~ ~ Set up old data
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
      const patient1 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const patient2 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const patient3 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const facility1 = await models.Facility.create({
        ...fake(models.Facility),
      });
      const facility2 = await models.Facility.create({
        ...fake(models.Facility),
      });
      const otherFacility = await models.Facility.create({
        ...fake(models.Facility),
      });
      await models.User.create(fakeUser());
      await models.Department.create({
        ...fake(models.Department),
        facilityId: otherFacility.id,
      });
      await models.Location.create({
        ...fake(models.Location),
        facilityId: otherFacility.id,
      });
      const encounter1 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient1.id,
      });
      const encounter2 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient2.id,
      });
      const encounter3 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient2.id,
      });
      const encounter4 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient3.id,
      });

      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

      // ~ ~ ~ Set up data for marked for sync patients
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient1.id,
        facilityId: facility1.id,
      });
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient2.id,
        facilityId: facility2.id,
      });

      const centralSyncManager = initializeCentralSyncManager(ctx);
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 15,
          facilityIds: [facility1.id, facility2.id],
        },
        () => true,
      );

      const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
      const encounterIds = outgoingChanges
        .filter(c => c.recordType === 'encounters')
        .map(c => c.recordId);

      // Assert if outgoing changes contain the encounters (fully) for the marked for sync patients
      expect(encounterIds).toEqual(
        expect.arrayContaining([encounter1.id, encounter2.id, encounter3.id]),
      );
      expect(encounterIds).not.toEqual(expect.arrayContaining([encounter4.id]));
    });

    it('returns only newly created encounter for a previously marked-for-sync patient', async () => {
      const OLD_SYNC_TICK = 10;
      const NEW_SYNC_TICK = 20;

      // ~ ~ ~ Set up old data
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, OLD_SYNC_TICK);
      const patient1 = await models.Patient.create({
        ...fake(models.Patient),
      });
      const facility = await models.Facility.create({
        ...fake(models.Facility),
      });
      await models.User.create(fakeUser());
      await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      });
      await models.Location.create({
        ...fake(models.Location),
        facilityId: facility.id,
      });
      // Create encounter 1 having the same sync tick as the patient_facility
      await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient1.id,
      });

      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, NEW_SYNC_TICK);

      const encounter2 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient1.id,
      });

      const centralSyncManager = initializeCentralSyncManager(ctx);
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
      const sessionTwoEncounterIds = outgoingChanges
        .filter(c => c.recordType === 'encounters')
        .map(c => c.recordId);

      // Assert if outgoing changes contain only encounter2 and not encounter1
      expect(sessionTwoEncounterIds).toHaveLength(1);
      expect(sessionTwoEncounterIds[0]).toEqual(encounter2.id);
    });
  });
});
