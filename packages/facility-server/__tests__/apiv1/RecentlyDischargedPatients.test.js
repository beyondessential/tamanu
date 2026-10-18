import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';
import { subHours } from 'date-fns';
import {
  ENCOUNTER_TYPES,
  ENCOUNTER_TYPE_PATIENT_STATUSES,
  PATIENT_STATUSES,
} from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { instantToDateTimeStringInTimezone } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { createTestContext } from '../utilities';

const hoursAgo = hours =>
  instantToDateTimeStringInTimezone(subHours(new Date(), hours), getPrimaryTimeZone());

describe('Recently discharged patients', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models;
  let baseApp;
  let app;
  let location;
  let otherFacilityLocation;
  let department;
  let otherDepartment;
  let discharger;
  let otherDischarger;

  const createPatient = async (overrides = {}) =>
    models.Patient.create(await createDummyPatient(models, overrides));

  const createDischargedEncounter = async (
    patient,
    { hoursSinceDischarge = 1, dischargerId = discharger.id, ...overrides } = {},
  ) => {
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, {
        patientId: patient.id,
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: hoursAgo(hoursSinceDischarge + 2),
        endDate: hoursAgo(hoursSinceDischarge),
        locationId: location.id,
        departmentId: department.id,
        examinerId: discharger.id,
        ...overrides,
      }),
    );
    await models.Discharge.create({ encounterId: encounter.id, dischargerId });
    return encounter;
  };

  // Other suites share the database, so each test only inspects the rows for its own patients,
  // in the order the endpoint returned them.
  const fetchRowsFor = async (patients, query = {}) => {
    const patientIds = new Set(patients.map(patient => patient.id));
    const response = await app
      .get('/api/recentlyDischargedPatients')
      .query({ rowsPerPage: 1000, ...query });
    expect(response).toHaveSucceeded();
    return response.body.data.filter(row => patientIds.has(row.id));
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, baseApp } = ctx);
    app = await baseApp.asRole('practitioner');

    await models.Facility.upsert({ id: facilityId, name: facilityId, code: facilityId });
    const otherFacility = await models.Facility.create(fake(models.Facility));
    location = await models.Location.create(fake(models.Location, { facilityId }));
    otherFacilityLocation = await models.Location.create(
      fake(models.Location, { facilityId: otherFacility.id }),
    );
    department = await models.Department.create(fake(models.Department, { facilityId }));
    otherDepartment = await models.Department.create(fake(models.Department, { facilityId }));
    discharger = await models.User.create(fakeUser());
    otherDischarger = await models.User.create(fakeUser());
  });
  afterAll(() => ctx.close());

  it('requires permission to list patients', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const response = await noPermsApp.get('/api/recentlyDischargedPatients');
    expect(response).toBeForbidden();
  });

  describe('which discharges are listed', () => {
    it('lists a patient discharged within the past 24 hours, with their discharge details', async () => {
      const patient = await createPatient();
      const encounter = await createDischargedEncounter(patient, { hoursSinceDischarge: 2 });

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([
        expect.objectContaining({
          id: patient.id,
          displayId: patient.displayId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          sex: patient.sex,
          patientStatus: PATIENT_STATUSES.INPATIENT,
          dischargeDate: encounter.endDate,
          departmentId: department.id,
          departmentName: department.name,
          clinician: discharger.displayName,
        }),
      ]);
    });

    it('leaves out discharges older than 24 hours, open encounters, and other facilities', async () => {
      const dischargedTooLongAgo = await createPatient();
      await createDischargedEncounter(dischargedTooLongAgo, { hoursSinceDischarge: 25 });
      const stillAdmitted = await createPatient();
      await models.Encounter.create(
        await createDummyEncounter(models, {
          current: true,
          patientId: stillAdmitted.id,
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          locationId: location.id,
          departmentId: department.id,
          examinerId: discharger.id,
        }),
      );
      const dischargedElsewhere = await createPatient();
      await createDischargedEncounter(dischargedElsewhere, {
        locationId: otherFacilityLocation.id,
      });

      const rows = await fetchRowsFor([dischargedTooLongAgo, stillAdmitted, dischargedElsewhere]);

      expect(rows).toEqual([]);
    });

    it('lists each encounter type under its patient status, leaving out types without one', async () => {
      const patientsByEncounterType = {};
      for (const encounterType of Object.values(ENCOUNTER_TYPES)) {
        const patient = await createPatient();
        await createDischargedEncounter(patient, { encounterType });
        patientsByEncounterType[encounterType] = patient;
      }

      const rows = await fetchRowsFor(Object.values(patientsByEncounterType));

      const statusesByEncounterType = Object.fromEntries(
        Object.entries(patientsByEncounterType)
          .map(([encounterType, patient]) => [
            encounterType,
            rows.find(row => row.id === patient.id)?.patientStatus,
          ])
          .filter(([, patientStatus]) => patientStatus),
      );
      expect(statusesByEncounterType).toEqual(ENCOUNTER_TYPE_PATIENT_STATUSES);
    });

    it('lists automatic discharges, with no clinician', async () => {
      const patient = await createPatient();
      await createDischargedEncounter(patient, { dischargerId: null });

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([expect.objectContaining({ id: patient.id, clinician: null })]);
    });

    it('lists each patient once, for their most recent discharge', async () => {
      const patient = await createPatient();
      await createDischargedEncounter(patient, {
        hoursSinceDischarge: 10,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        departmentId: otherDepartment.id,
      });
      const latestEncounter = await createDischargedEncounter(patient, { hoursSinceDischarge: 2 });

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([
        expect.objectContaining({
          id: patient.id,
          patientStatus: PATIENT_STATUSES.INPATIENT,
          departmentId: department.id,
          dischargeDate: latestEncounter.endDate,
        }),
      ]);
    });

    it('lists deceased patients', async () => {
      const patient = await createPatient({ dateOfDeath: hoursAgo(1) });
      await createDischargedEncounter(patient);

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([
        expect.objectContaining({ id: patient.id, dateOfDeath: patient.dateOfDeath }),
      ]);
    });
  });

  describe('search', () => {
    it('matches Patient ID, first name, and last name on any part of the value, ignoring case', async () => {
      const matching = await createPatient({
        displayId: 'RDP-SEARCH-ID-1',
        firstName: 'Rdp-search-first',
        lastName: 'Rdp-search-last',
      });
      const other = await createPatient();
      await createDischargedEncounter(matching);
      await createDischargedEncounter(other);

      for (const query of [
        { displayId: 'search-id' },
        { firstName: 'SEARCH-FIRST' },
        { lastName: 'search-last' },
      ]) {
        const rows = await fetchRowsFor([matching, other], query);
        expect(rows.map(row => row.id)).toEqual([matching.id]);
      }
    });

    it('filters by encounter type, department, and discharging clinician', async () => {
      const matching = await createPatient();
      const otherStatus = await createPatient();
      const otherDepartmentPatient = await createPatient();
      const otherClinicianPatient = await createPatient();
      await createDischargedEncounter(matching);
      await createDischargedEncounter(otherStatus, { encounterType: ENCOUNTER_TYPES.CLINIC });
      await createDischargedEncounter(otherDepartmentPatient, { departmentId: otherDepartment.id });
      await createDischargedEncounter(otherClinicianPatient, { dischargerId: otherDischarger.id });
      const patients = [matching, otherStatus, otherDepartmentPatient, otherClinicianPatient];

      const rows = await fetchRowsFor(patients, {
        patientStatus: PATIENT_STATUSES.INPATIENT,
        departmentId: department.id,
        dischargingClinicianId: discharger.id,
      });

      expect(rows.map(row => row.id)).toEqual([matching.id]);
    });

    it('lists a patient for their most recent discharge that matches the search', async () => {
      const patient = await createPatient();
      const olderMatchingEncounter = await createDischargedEncounter(patient, {
        hoursSinceDischarge: 10,
        departmentId: otherDepartment.id,
      });
      await createDischargedEncounter(patient, {
        hoursSinceDischarge: 6,
        departmentId: otherDepartment.id,
        encounterType: ENCOUNTER_TYPES.CLINIC,
      });
      await createDischargedEncounter(patient, { hoursSinceDischarge: 2 });

      const rows = await fetchRowsFor([patient], {
        departmentId: otherDepartment.id,
        patientStatus: PATIENT_STATUSES.INPATIENT,
      });

      expect(rows).toEqual([
        expect.objectContaining({
          id: patient.id,
          departmentId: otherDepartment.id,
          patientStatus: PATIENT_STATUSES.INPATIENT,
          dischargeDate: olderMatchingEncounter.endDate,
        }),
      ]);
    });
  });

  describe('sorting', () => {
    it('orders by discharge date, most recent first, by default', async () => {
      const dischargedFiveHoursAgo = await createPatient();
      const dischargedOneHourAgo = await createPatient();
      const dischargedThreeHoursAgo = await createPatient();
      await createDischargedEncounter(dischargedFiveHoursAgo, { hoursSinceDischarge: 5 });
      await createDischargedEncounter(dischargedOneHourAgo, { hoursSinceDischarge: 1 });
      await createDischargedEncounter(dischargedThreeHoursAgo, { hoursSinceDischarge: 3 });

      const rows = await fetchRowsFor([
        dischargedFiveHoursAgo,
        dischargedOneHourAgo,
        dischargedThreeHoursAgo,
      ]);

      expect(rows.map(row => row.id)).toEqual([
        dischargedOneHourAgo.id,
        dischargedThreeHoursAgo.id,
        dischargedFiveHoursAgo.id,
      ]);
    });

    it('groups rows by patient status when sorting by encounter type', async () => {
      const patients = [];
      for (const encounterType of [
        ENCOUNTER_TYPES.CLINIC,
        ENCOUNTER_TYPES.ADMISSION,
        ENCOUNTER_TYPES.TRIAGE,
        ENCOUNTER_TYPES.IMAGING,
        ENCOUNTER_TYPES.EMERGENCY,
      ]) {
        const patient = await createPatient();
        await createDischargedEncounter(patient, { encounterType });
        patients.push(patient);
      }

      const rows = await fetchRowsFor(patients, { orderBy: 'patientStatus', order: 'asc' });

      expect(rows.map(row => row.patientStatus)).toEqual([
        PATIENT_STATUSES.EMERGENCY,
        PATIENT_STATUSES.EMERGENCY,
        PATIENT_STATUSES.INPATIENT,
        PATIENT_STATUSES.OUTPATIENT,
        PATIENT_STATUSES.OUTPATIENT,
      ]);
    });
  });
});
