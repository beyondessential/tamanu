import { sub } from 'date-fns';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  APPOINTMENT_STATUSES,
  NOTE_TYPES,
  REFERENCE_TYPES,
  REPEAT_FREQUENCY,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { toDateTimeString } from '@tamanu/utils/dateTime';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';
import { OutpatientDischarger } from '../../dist/tasks/OutpatientDischarger';

describe('CentralSyncManager Edge Cases', () => {
  let ctx;
  let models;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
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
    await models.PatientOngoingPrescription.truncate({ cascade: true, force: true });
    await models.EncounterPrescription.truncate({ cascade: true, force: true });
    await models.Prescription.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
    await models.Location.truncate({ cascade: true, force: true });
    await models.Department.truncate({ cascade: true, force: true });
    await models.PatientFacility.truncate({ cascade: true, force: true });
    await models.Patient.truncate({ cascade: true, force: true });
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
  });

  afterAll(() => ctx.close());

  describe('resolves out of bounds appointments in cancelled schedule', () => {
    it('deletes out of bound appointments generated on central when syncing a schedule that has been cancelled', async () => {
      // Set up data pre sync
      const CURRENT_SYNC_TICK = '15';
      await models.Setting.set('appointments.maxRepeatingAppointmentsPerGeneration', 2);
      settingsCache.reset();
      const facility = await models.Facility.create(fake(models.Facility));
      const patient = await models.Patient.create({
        ...fake(models.Patient),
      });
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patient.id,
        facilityId: facility.id,
      });
      const locationGroup = await models.LocationGroup.create({
        ...fake(models.LocationGroup),
        facilityId: facility.id,
      });
      await models.ReferenceData.create({
        id: 'appointmentType-standard',
        type: 'appointmentType',
        code: 'standard',
        name: 'Standard',
      });
      const { schedule, firstAppointment } = await models.Appointment.createWithSchedule({
        settings: ctx.settings,
        appointmentData: {
          status: APPOINTMENT_STATUSES.CONFIRMED,
          startTime: '1990-10-02 12:00:00',
          endTime: '1990-10-02 13:00:00',
          locationGroupId: locationGroup.id,
          patientId: patient.id,
        },
        scheduleData: {
          // Until date covers 4 appointments, 2 of which will be initially created
          untilDate: '1990-10-23',
          interval: 1,
          frequency: REPEAT_FREQUENCY.WEEKLY,
          daysOfWeek: ['WE'],
        },
      });

      const createDataAppointment = firstAppointment.toCreateData();

      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // The remaining 2 appointments are created by scheduled task
      const generatedAppointments = await models.Appointment.bulkCreate([
        {
          ...createDataAppointment,
          startTime: '1990-10-16 12:00:00',
          endTime: '1990-10-16 13:00:00',
        },
        {
          ...createDataAppointment,
          startTime: '1990-10-23 12:00:00',
          endTime: '1990-10-23 13:00:00',
        },
      ]);

      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);

      // Schedule is cancelled before the generated appointments had synced down.
      const toBeSyncedAppointmentData1 = {
        ...appointmentsInSchedule[0].get({ plain: true }),
        status: APPOINTMENT_STATUSES.CANCELLED,
      };
      const toBeSyncedAppointmentData2 = {
        ...appointmentsInSchedule[1].get({ plain: true }),
        status: APPOINTMENT_STATUSES.CANCELLED,
      };

      const toBeSyncedAppointmentScheduleData = {
        ...schedule.get({ plain: true }),
        // Facility is only aware that the first two appointments are generated at time of cancelling
        generatedUntilDate: '1990-10-09',
        cancelledAtDate: '1990-10-02',
        isFullyGenerated: true,
      };

      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'appointments',
          recordId: toBeSyncedAppointmentData1.id,
          data: toBeSyncedAppointmentData1,
        },
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'appointments',
          recordId: toBeSyncedAppointmentData2.id,
          data: toBeSyncedAppointmentData2,
        },
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'appointment_schedules',
          recordId: schedule.id,
          data: toBeSyncedAppointmentScheduleData,
        },
      ];

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });
      await centralSyncManager.updateLookupTable();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      // Push the cancelled schedule
      await centralSyncManager.addIncomingChanges(sessionId, changes);
      await centralSyncManager.completePush(sessionId, facility.id);
      await waitForPushCompleted(centralSyncManager, sessionId);

      await centralSyncManager.updateLookupTable();

      // Start the snapshot for pull process
      await centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 1,
          facilityIds: [facility.id],
          deviceId: facility.id,
        },
        () => true,
      );

      const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
      const returnedAppointments = outgoingChanges.filter(c => c.recordType === 'appointments');

      // Check if the out of bounds appointments are deleted
      expect(returnedAppointments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            isDeleted: true,
            data: expect.objectContaining({
              id: generatedAppointments[0].id,
            }),
          }),
          expect.objectContaining({
            isDeleted: true,
            data: expect.objectContaining({
              id: generatedAppointments[1].id,
            }),
          }),
        ]),
      );
    });
  });

  describe('deterministic patient ongoing prescription id', () => {
    it('results in a single patient ongoing prescription and a valid sync_lookup when the same encounter is manually discharged on facility and auto-discharged on central then facility syncs', async () => {
      const CURRENT_SYNC_TICK = '20';
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);

      const facility = await models.Facility.create(fake(models.Facility));
      const patient = await models.Patient.create(fake(models.Patient));
      await models.PatientFacility.create({
        patientId: patient.id,
        facilityId: facility.id,
      });
      const examiner = await models.User.create(fakeUser());
      const department = await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      });
      const location = await models.Location.create({
        ...fake(models.Location),
        facilityId: facility.id,
      });
      const medicationReference = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: 'drug' }),
      );

      await models.ReferenceData.create({
        id: NOTE_TYPES.SYSTEM,
        code: 'system',
        name: 'System',
        type: REFERENCE_TYPES.NOTE_TYPE,
        visibilityStatus: 'current',
        systemRequired: true,
      });

      const encounter = await models.Encounter.create({
        ...fake(models.Encounter, {
          patientId: patient.id,
          departmentId: department.id,
          locationId: location.id,
          examinerId: examiner.id,
          encounterType: ENCOUNTER_TYPES.CLINIC,
          startDate: toDateTimeString(sub(new Date(), { days: 2 })),
          endDate: null,
        }),
      });

      const prescription = await models.Prescription.create(
        fake(models.Prescription, {
          medicationId: medicationReference.id,
          isOngoing: true,
          discontinued: false,
        }),
      );

      await models.EncounterPrescription.create({
        ...fake(models.EncounterPrescription, {
          encounterId: encounter.id,
          prescriptionId: prescription.id,
        }),
      });

      // Central auto-discharger runs and creates PatientOngoingPrescription
      const discharger = new OutpatientDischarger(ctx, {
        schedule: '',
        suppressInitialRun: true,
        batchSleepAsyncDurationInMilliseconds: 1,
      });
      await discharger.run();

      const centralCreatedPop = await models.PatientOngoingPrescription.findOne({
        where: { patientId: patient.id, prescriptionId: prescription.id },
      });
      expect(centralCreatedPop).not.toBeNull();

      // Facility would have the same deterministic id when it manually discharged. Use the
      // same formula as the DB so that without deterministic ids (central has random id)
      // we send a different id and get two rows → test fails.
      const deterministicId = `${patient.id.replace(/;/g, ':')};${prescription.id.replace(/;/g, ':')}`;

      const facilityChangePayload = {
        ...centralCreatedPop.get({ plain: true }),
        id: deterministicId,
        updatedAtSyncTick: parseInt(CURRENT_SYNC_TICK, 10),
      };
      const changes = [
        {
          direction: SYNC_SESSION_DIRECTION.OUTGOING,
          isDeleted: false,
          recordType: 'patient_ongoing_prescriptions',
          recordId: deterministicId,
          data: facilityChangePayload,
        },
      ];

      const centralSyncManager = initializeCentralSyncManager({
        sync: {
          lookupTable: {
            enabled: true,
          },
          maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        },
      });
      await centralSyncManager.updateLookupTable();
      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 1,
          facilityIds: [facility.id],
        },
        () => true,
      );

      await centralSyncManager.addIncomingChanges(sessionId, changes);
      await centralSyncManager.completePush(sessionId, facility.id, [
        'patient_ongoing_prescriptions',
      ]);
      await waitForPushCompleted(centralSyncManager, sessionId);

      const count = await models.PatientOngoingPrescription.count({
        where: { patientId: patient.id, prescriptionId: prescription.id },
      });
      expect(count).toBe(1);

      // Bump the sync tick on the prescription to trigger a sync lookup update, which would error if there were multiple patient ongoing prescriptions for the same patient and prescription.
      await prescription.update({
        updatedAtSyncTick: parseInt(CURRENT_SYNC_TICK, 10),
      });
      await expect(centralSyncManager.updateLookupTable()).resolves.not.toThrow();

      const lookupRows = await models.SyncLookup.findAll({
        where: {
          recordType: 'patient_ongoing_prescriptions',
          recordId: deterministicId,
        },
      });
      expect(lookupRows).toHaveLength(1);
    });
  });
});
