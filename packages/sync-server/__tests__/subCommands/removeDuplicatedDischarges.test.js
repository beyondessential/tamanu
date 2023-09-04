import { sub } from 'date-fns';

import { createDummyEncounter, createDummyPatient } from '@tamanu/shared/demoData/patients';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { toDateTimeString, getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { sleepAsync } from '@tamanu/shared/utils';

import { createTestContext } from '../utilities';
import { removeDuplicatedDischarges } from '../../app/subCommands';

describe('removeDuplicatedDischarges', () => {
  let ctx;
  let models;
  let patient;
  let facility;
  let clinician;
  let department;
  let location;
  let locationGroup;

  const SUB_COMMAND_OPTIONS = {
    batchSize: 1,
  };

  const getDateSubtractedFromNow = daysToSubtract =>
    toDateTimeString(sub(new Date(), { days: daysToSubtract }));

  const createEncounter = async (encounterPatient, overrides = {}) => {
    return models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: encounterPatient.id,
      ...overrides,
    });
  };

  const createLocation = async (locationName, overrides) => {
    return models.Location.create(
      fake(models.Location, {
        name: locationName,
        facilityId: facility.id,
        locationGroupId: locationGroup.id,
        ...overrides,
      }),
    );
  };

  const createDepartment = async (departmentName, overrides) => {
    return models.Department.create(
      fake(models.Department, { name: departmentName, facilityId: facility.id, ...overrides }),
    );
  };

  const createUser = async (clinicianName, overrides) => {
    return models.User.create(
      fake(models.User, {
        displayName: clinicianName,
        ...overrides,
      }),
    );
  };

  const clearTestData = async () => {
    await models.Encounter.truncate({ cascade: true, force: true });
    await models.Discharge.truncate({
      cascade: true,
      force: true,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    patient = await models.Patient.create(await createDummyPatient(models));
    facility = await models.Facility.create({
      ...fake(models.Facility),
      name: 'Utopia HQ',
    });
    locationGroup = await models.LocationGroup.create({
      code: 'ward-1',
      name: 'Ward 1',
      facilityId: facility.id,
    });
    location = await createLocation('location1');
    clinician = await createUser('Clinician 1');
    department = await createDepartment('department1');
  });

  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(() => ctx.close());

  it('removes all duplicated discharges except for the oldest for single encounter', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    const encounter = await createEncounter(patient, {
      departmentId: department.id,
      locationId: location.id,
      examinerId: clinician.id,
      encounterType: 'admission',
      startDate: getDateSubtractedFromNow(6),
    });

    const discharge1Data = {
      endDate: getDateSubtractedFromNow(6),
      submittedTime: getCurrentDateTimeString(),
      discharge: {
        dischargerId: clinician.id,
        note: 'Discharge 1',
      },
    };
    await encounter.onDischarge(discharge1Data, clinician.id);

    await sleepAsync(50);

    const discharge2Data = {
      endDate: getDateSubtractedFromNow(4),
      submittedTime: getCurrentDateTimeString(),
      discharge: {
        dischargerId: clinician.id,
        note: 'Discharge 2',
      },
    };
    await encounter.onDischarge(discharge2Data, clinician.id);

    await sleepAsync(50);

    const discharge3Data = {
      endDate: getDateSubtractedFromNow(2),
      submittedTime: getCurrentDateTimeString(),
      discharge: {
        dischargerId: clinician.id,
        note: 'Discharge 3',
      },
    };
    await encounter.onDischarge(discharge3Data, clinician.id);

    const dischargesBeforeMigration = await models.Discharge.findAll({
      order: [['updatedAt', 'ASC']],
    });
    expect(dischargesBeforeMigration).toHaveLength(3);

    await removeDuplicatedDischarges(SUB_COMMAND_OPTIONS);

    expect(exitSpy).toBeCalledWith(0);

    const dischargesAfterMigration = await models.Discharge.findAll({
      order: [['updatedAt', 'ASC']],
    });
    expect(dischargesAfterMigration).toHaveLength(1);

    // should keep the latest discharge data
    expect(dischargesAfterMigration[0]).toMatchObject({
      note: discharge1Data.discharge.note,
      encounterId: encounter.id,
      dischargerId: discharge1Data.discharge.dischargerId,
    });
  });

  it('removes all duplicated discharges except for the oldest for multiple encounters', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    const encounter1 = await createEncounter(patient, {
      departmentId: department.id,
      locationId: location.id,
      examinerId: clinician.id,
      encounterType: 'admission',
      startDate: getDateSubtractedFromNow(8),
    });
    const encounter2 = await createEncounter(patient, {
      departmentId: department.id,
      locationId: location.id,
      examinerId: clinician.id,
      encounterType: 'clinic',
      startDate: getDateSubtractedFromNow(6),
    });

    const encounter1Discharge1Data = {
      endDate: getDateSubtractedFromNow(6),
      submittedTime: getDateSubtractedFromNow(6),
      discharge: {
        dischargerId: clinician.id,
        note: 'Encounter 1 Discharge 1',
      },
    };
    const encounter1Discharge2Data = {
      endDate: getDateSubtractedFromNow(5),
      submittedTime: getDateSubtractedFromNow(5),
      discharge: {
        dischargerId: clinician.id,
        note: 'Encounter 1 Discharge 2',
      },
    };

    const encounter2Discharge1Data = {
      endDate: getDateSubtractedFromNow(4),
      submittedTime: getDateSubtractedFromNow(4),
      discharge: {
        dischargerId: clinician.id,
        note: 'Encounter 2 Discharge 1',
      },
    };
    const encounter2Discharge2Data = {
      endDate: getDateSubtractedFromNow(3),
      submittedTime: getDateSubtractedFromNow(3),
      discharge: {
        dischargerId: clinician.id,
        note: 'Encounter 2 Discharge 2',
      },
    };

    await encounter1.onDischarge(encounter1Discharge1Data, clinician.id);
    await sleepAsync(100);
    await encounter1.onDischarge(encounter1Discharge2Data, clinician.id);
    await sleepAsync(100);
    await encounter2.onDischarge(encounter2Discharge1Data, clinician.id);
    await sleepAsync(100);
    await encounter2.onDischarge(encounter2Discharge2Data, clinician.id);

    const dischargesBeforeMigration = await models.Discharge.findAll({
      order: [['updatedAt', 'ASC']],
    });
    expect(dischargesBeforeMigration).toHaveLength(4);

    await removeDuplicatedDischarges(SUB_COMMAND_OPTIONS);

    expect(exitSpy).toBeCalledWith(0);

    const dischargesAfterMigration = await models.Discharge.findAll({
      order: [['updatedAt', 'ASC']],
    });
    expect(dischargesAfterMigration).toHaveLength(2);

    // should keep the latest discharge data
    expect(dischargesAfterMigration[0]).toMatchObject({
      note: encounter1Discharge1Data.discharge.note,
      encounterId: encounter1.id,
      dischargerId: encounter1Discharge2Data.discharge.dischargerId,
    });

    expect(dischargesAfterMigration[1]).toMatchObject({
      note: encounter2Discharge1Data.discharge.note,
      encounterId: encounter2.id,
      dischargerId: encounter2Discharge2Data.discharge.dischargerId,
    });
  });
});
