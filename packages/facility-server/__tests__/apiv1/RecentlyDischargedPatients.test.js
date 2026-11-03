import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';
import { addMinutes, subHours } from 'date-fns';
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
  let area;
  let otherArea;
  let location;
  let otherAreaLocation;
  let locationWithoutArea;
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

  // Other suites share the database, so each test reads every page and only inspects the rows for
  // its own patients, in the order the endpoint returned them.
  const fetchRowsFor = async (patients, query = {}) => {
    const patientIds = new Set(patients.map(patient => patient.id));
    const rows = [];
    for (let page = 0; ; page++) {
      const response = await app
        .get('/api/recentlyDischargedPatients')
        .query({ ...query, rowsPerPage: 50, page });
      expect(response).toHaveSucceeded();
      rows.push(...response.body.data);
      if (response.body.data.length === 0 || rows.length >= response.body.count) break;
    }
    return rows.filter(row => patientIds.has(row.id));
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, baseApp } = ctx);
    app = await baseApp.asRole('practitioner');

    await models.Facility.upsert({ id: facilityId, name: facilityId, code: facilityId });
    const otherFacility = await models.Facility.create(fake(models.Facility));
    area = await models.LocationGroup.create(fake(models.LocationGroup, { facilityId }));
    otherArea = await models.LocationGroup.create(fake(models.LocationGroup, { facilityId }));
    location = await models.Location.create(
      fake(models.Location, { facilityId, locationGroupId: area.id }),
    );
    otherAreaLocation = await models.Location.create(
      fake(models.Location, { facilityId, locationGroupId: otherArea.id }),
    );
    locationWithoutArea = await models.Location.create(
      fake(models.Location, { facilityId, locationGroupId: null }),
    );
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
          locationGroupId: area.id,
          locationGroupName: area.name,
          departmentId: department.id,
          departmentName: department.name,
          clinician: discharger.displayName,
        }),
      ]);
    });

    it('shows the area the patient was discharged from, after a move during their stay', async () => {
      const patient = await createPatient();
      const encounter = await models.Encounter.create(
        await createDummyEncounter(models, {
          current: true,
          patientId: patient.id,
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: hoursAgo(5),
          locationId: otherAreaLocation.id,
          departmentId: department.id,
          examinerId: discharger.id,
        }),
      );
      await encounter.update({ locationId: location.id });
      await encounter.update({
        endDate: hoursAgo(1),
        discharge: { dischargerId: discharger.id },
      });

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([
        expect.objectContaining({
          id: patient.id,
          locationGroupId: area.id,
          locationGroupName: area.name,
        }),
      ]);
    });

    it('lists a discharge from a location with no area, with no area', async () => {
      const patient = await createPatient();
      await createDischargedEncounter(patient, { locationId: locationWithoutArea.id });

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([
        expect.objectContaining({ id: patient.id, locationGroupId: null, locationGroupName: null }),
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

    it('lists a discharge dated in the future, so it can be noticed', async () => {
      const patient = await createPatient();
      const encounter = await createDischargedEncounter(patient, { hoursSinceDischarge: -2 });

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([
        expect.objectContaining({ id: patient.id, dischargeDate: encounter.endDate }),
      ]);
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

    it('shows the clinician from the newest discharge record when an encounter has several', async () => {
      const patient = await createPatient();
      const encounter = await createDischargedEncounter(patient, {
        dischargerId: otherDischarger.id,
      });
      // A second discharge record for the same encounter, as an offline sync conflict can leave
      await models.Discharge.create({
        encounterId: encounter.id,
        dischargerId: discharger.id,
        createdAt: addMinutes(new Date(), 1),
      });

      const rows = await fetchRowsFor([patient]);

      expect(rows).toEqual([
        expect.objectContaining({ id: patient.id, clinician: discharger.displayName }),
      ]);
    });

    it('counts and pages by patient rather than by discharge', async () => {
      const lastName = 'Rdp-count-and-page';
      const dischargedTwice = await createPatient({ lastName });
      const dischargedOnce = await createPatient({ lastName });
      await createDischargedEncounter(dischargedTwice, { hoursSinceDischarge: 4 });
      await createDischargedEncounter(dischargedTwice, { hoursSinceDischarge: 1 });
      await createDischargedEncounter(dischargedOnce, { hoursSinceDischarge: 2 });

      const fetchPage = page =>
        app.get('/api/recentlyDischargedPatients').query({ lastName, rowsPerPage: 1, page });
      const firstPage = await fetchPage(0);
      const secondPage = await fetchPage(1);

      expect(firstPage).toHaveSucceeded();
      expect(secondPage).toHaveSucceeded();
      expect(firstPage.body.count).toBe(2);
      expect(firstPage.body.data.map(row => row.id)).toEqual([dischargedTwice.id]);
      expect(secondPage.body.data.map(row => row.id)).toEqual([dischargedOnce.id]);
    });

    it('caps the page size, and falls back to defaults for invalid paging values', async () => {
      const lastName = 'Rdp-page-size';
      for (let i = 0; i < 51; i++) {
        const patient = await createPatient({ lastName });
        await createDischargedEncounter(patient);
      }

      const oversizedPage = await app
        .get('/api/recentlyDischargedPatients')
        .query({ lastName, rowsPerPage: 1000000 });
      const invalidPaging = await app
        .get('/api/recentlyDischargedPatients')
        .query({ lastName, rowsPerPage: 'many', page: -1 });

      expect(oversizedPage).toHaveSucceeded();
      expect(oversizedPage.body).toMatchObject({ count: 51 });
      expect(oversizedPage.body.data).toHaveLength(50);
      expect(invalidPaging).toHaveSucceeded();
      expect(invalidPaging.body.data).toHaveLength(10);
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

    it('filters by encounter type, area, department, and discharging clinician', async () => {
      const matching = await createPatient();
      const otherStatus = await createPatient();
      const otherAreaPatient = await createPatient();
      const otherDepartmentPatient = await createPatient();
      const otherClinicianPatient = await createPatient();
      await createDischargedEncounter(matching);
      await createDischargedEncounter(otherStatus, { encounterType: ENCOUNTER_TYPES.CLINIC });
      await createDischargedEncounter(otherAreaPatient, { locationId: otherAreaLocation.id });
      await createDischargedEncounter(otherDepartmentPatient, { departmentId: otherDepartment.id });
      await createDischargedEncounter(otherClinicianPatient, { dischargerId: otherDischarger.id });
      const patients = [
        matching,
        otherStatus,
        otherAreaPatient,
        otherDepartmentPatient,
        otherClinicianPatient,
      ];

      const rows = await fetchRowsFor(patients, {
        patientStatus: PATIENT_STATUSES.INPATIENT,
        locationGroupId: area.id,
        departmentId: department.id,
        dischargingClinicianId: discharger.id,
      });

      expect(rows.map(row => row.id)).toEqual([matching.id]);
    });

    it('lists a patient for their most recent discharge that matches the search', async () => {
      const patient = await createPatient();
      const olderMatchingEncounter = await createDischargedEncounter(patient, {
        hoursSinceDischarge: 10,
        locationId: otherAreaLocation.id,
        departmentId: otherDepartment.id,
      });
      await createDischargedEncounter(patient, {
        hoursSinceDischarge: 8,
        departmentId: otherDepartment.id,
      });
      await createDischargedEncounter(patient, {
        hoursSinceDischarge: 6,
        locationId: otherAreaLocation.id,
        departmentId: otherDepartment.id,
        encounterType: ENCOUNTER_TYPES.CLINIC,
      });
      await createDischargedEncounter(patient, { hoursSinceDischarge: 2 });

      const rows = await fetchRowsFor([patient], {
        locationGroupId: otherArea.id,
        departmentId: otherDepartment.id,
        patientStatus: PATIENT_STATUSES.INPATIENT,
      });

      expect(rows).toEqual([
        expect.objectContaining({
          id: patient.id,
          locationGroupId: otherArea.id,
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

    it('sorts by area ignoring case, with discharges from locations with no area last', async () => {
      const createLocationInArea = async areaName => {
        const sortArea = await models.LocationGroup.create(
          fake(models.LocationGroup, { facilityId, name: areaName }),
        );
        return models.Location.create(
          fake(models.Location, { facilityId, locationGroupId: sortArea.id }),
        );
      };
      const dischargeLocations = [
        await createLocationInArea('Rdp sort ward b'),
        locationWithoutArea,
        await createLocationInArea('Rdp sort ward A'),
        await createLocationInArea('Rdp sort ward C'),
      ];
      const patients = [];
      for (const dischargeLocation of dischargeLocations) {
        const patient = await createPatient();
        await createDischargedEncounter(patient, { locationId: dischargeLocation.id });
        patients.push(patient);
      }

      const rows = await fetchRowsFor(patients, { orderBy: 'locationGroupName', order: 'asc' });

      expect(rows.map(row => row.locationGroupName)).toEqual([
        'Rdp sort ward A',
        'Rdp sort ward b',
        'Rdp sort ward C',
        null,
      ]);
    });
  });
});
