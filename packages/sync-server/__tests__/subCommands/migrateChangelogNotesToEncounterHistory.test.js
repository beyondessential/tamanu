import { sub } from 'date-fns';
import { Op } from 'sequelize';

import { toDateTimeString, getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { createDummyEncounter, createDummyPatient } from '@tamanu/shared/demoData/patients';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { NOTE_RECORD_TYPES, NOTE_TYPES } from '@tamanu/shared/constants';

import { createTestContext } from '../utilities';
import { migrateChangelogNotesToEncounterHistory } from '../../app/subCommands';

const addSystemNote = async (models, recordId, content, date) => {
  const notePage = await models.LegacyNotePage.create({
    recordId,
    recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    date,
    noteType: NOTE_TYPES.SYSTEM,
  });

  await models.LegacyNoteItem.create({
    notePageId: notePage.id,
    date,
    content,
  });
};

const addLocationChangeNote = async (
  models,
  recordId,
  oldLocationId,
  newLocationId,
  submittedTime,
) => {
  const { Location } = models;
  const oldLocation = await Location.findOne({
    where: { id: oldLocationId },
    include: 'locationGroup',
  });
  const newLocation = await Location.findOne({
    where: { id: newLocationId },
    include: 'locationGroup',
  });

  await addSystemNote(
    models,
    recordId,
    `Changed location from ${Location.formatFullLocationName(
      oldLocation,
    )} to ${Location.formatFullLocationName(newLocation)}`,
    submittedTime,
  );
};

const addDepartmentChangeNote = async (
  models,
  recordId,
  fromDepartmentId,
  toDepartmentId,
  submittedTime,
) => {
  const { Department } = models;
  const oldDepartment = await Department.findOne({ where: { id: fromDepartmentId } });
  const newDepartment = await Department.findOne({ where: { id: toDepartmentId } });
  await addSystemNote(
    models,
    recordId,
    `Changed department from ${oldDepartment.name} to ${newDepartment.name}`,
    submittedTime,
  );
};

const updateClinician = async (models, recordId, oldClinicianId, newClinicianId, submittedTime) => {
  const { User } = models;
  const oldClinician = await User.findOne({ where: { id: oldClinicianId } });
  const newClinician = await User.findOne({ where: { id: newClinicianId } });
  await addSystemNote(
    models,
    recordId,
    `Changed supervising clinician from ${oldClinician.displayName} to ${newClinician.displayName}`,
    submittedTime,
  );
};

const onEncounterProgression = async (
  models,
  recordId,
  oldEncounterType,
  newEncounterType,
  submittedTime,
  user,
) => {
  await addSystemNote(
    models,
    recordId,
    `Changed type from ${oldEncounterType} to ${newEncounterType}`,
    submittedTime,
    user,
  );
};

describe('migrateChangelogNotesToEncounterHistory', () => {
  let ctx;
  let models;
  let patient;
  let facility1;
  let facility2;
  let placeholderUser;
  let placeholderDepartment;
  let placeholderLocation;
  let locationGroup1;
  let locationGroup2;

  const PLACEHOLDER_LOCATION_ID = 'PLACEHOLDER_LOCATION_ID';
  const PLACEHOLDER_DEPARTMENT_ID = 'PLACEHOLDER_DEPARTMENT_ID';
  const PLACEHOLDER_USER_ID = 'PLACEHOLDER_USER_ID';

  const SUB_COMMAND_OPTIONS = {
    batchSize: 1,
    placeholderLocation: PLACEHOLDER_LOCATION_ID,
    placeholderDepartment: PLACEHOLDER_DEPARTMENT_ID,
    placeholderUser: PLACEHOLDER_USER_ID,
  };

  const getDateSubtractedFromNow = daysToSubtract =>
    toDateTimeString(sub(new Date(), { days: daysToSubtract }));

  const createEncounter = async (encounterPatient, overrides = {}) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: encounterPatient.id,
      ...overrides,
    });

    // Clear the encounter_history data so that
    // the migration will not skip this encounter when migrating changelog
    await models.EncounterHistory.destroy({ where: { encounterId: encounter.id }, force: true });

    return encounter;
  };

  const createLocation = async (locationName, overrides) => {
    return models.Location.create(
      fake(models.Location, {
        name: locationName,
        facilityId: facility1.id,
        locationGroupId: locationGroup1.id,
        ...overrides,
      }),
    );
  };

  const createDepartment = async (departmentName, overrides) => {
    return models.Department.create(
      fake(models.Department, { name: departmentName, facilityId: facility1.id, ...overrides }),
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
    await models.EncounterHistory.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
    await models.Location.destroy({
      where: { id: { [Op.not]: placeholderLocation.id } },
      cascade: true,
      force: true,
    });
    await models.Department.destroy({
      where: { id: { [Op.not]: placeholderDepartment.id } },
      cascade: true,
      force: true,
    });
    await models.LegacyNoteItem.truncate({ cascade: true, force: true });
    await models.LegacyNotePage.truncate({ cascade: true, force: true });
    await models.User.destroy({
      where: { id: { [Op.not]: placeholderUser.id } },
      cascade: true,
      force: true,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    patient = await models.Patient.create(await createDummyPatient(models));
    facility1 = await models.Facility.create({
      ...fake(models.Facility),
      name: 'Utopia HQ',
    });

    facility2 = await models.Facility.create({
      ...fake(models.Facility),
      name: 'Epi HQ',
    });

    locationGroup1 = await models.LocationGroup.create({
      code: 'ward-1',
      name: 'Ward 1',
      facilityId: facility1.id,
    });
    locationGroup2 = await models.LocationGroup.create({
      code: 'ward-2',
      name: 'Ward 2',
      facilityId: facility1.id,
    });

    placeholderLocation = await createLocation('Placeholder location', {
      id: PLACEHOLDER_LOCATION_ID,
    });
    placeholderDepartment = await createDepartment('Placeholder department', {
      id: PLACEHOLDER_DEPARTMENT_ID,
    });
    placeholderUser = await createUser('Placeholder user', {
      id: PLACEHOLDER_USER_ID,
    });
  });

  afterAll(() => ctx.close());

  describe('with single change', () => {
    beforeEach(async () => {
      await clearTestData();
    });

    it('migrates changelog with location change', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const oldLocation = await createLocation('oldLocation');
      const newLocation = await createLocation('newLocation');
      const department = await createDepartment('department');
      const clinician = await createUser('testUser');
      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: oldLocation.id,
        examinerId: clinician.id,
        encounterType: 'admission',
        startDate: getDateSubtractedFromNow(6),
      });
      await addLocationChangeNote(
        models,
        encounter.id,
        oldLocation.id,
        newLocation.id,
        getCurrentDateTimeString(),
      );
      encounter.locationId = newLocation.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: oldLocation.id,
        examinerId: clinician.id,
        encounterType: 'admission',
      });

      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: newLocation.id,
        examinerId: clinician.id,
        encounterType: 'admission',
      });
    });

    it('migrates changelog with department change', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const oldDepartment = await createDepartment('oldDepartment');
      const newDepartment = await createDepartment('newDepartment');
      const clinician = await createUser('testUser');
      const encounter = await createEncounter(patient, {
        departmentId: oldDepartment.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'admission',
        startDate: getDateSubtractedFromNow(6),
      });
      await addDepartmentChangeNote(
        models,
        encounter.id,
        oldDepartment.id,
        newDepartment.id,
        getCurrentDateTimeString(),
      );
      encounter.departmentId = newDepartment.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: oldDepartment.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'admission',
      });

      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: newDepartment.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'admission',
      });
    });

    it('migrates changelog with clinician change', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const department = await createDepartment('department');
      const oldClinician = await createUser('oldClinician');
      const newClinician = await createUser('newClinician');
      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location.id,
        examinerId: oldClinician.id,
        encounterType: 'admission',
        startDate: getDateSubtractedFromNow(6),
      });
      await updateClinician(
        models,
        encounter.id,
        oldClinician.id,
        newClinician.id,
        getCurrentDateTimeString(),
      );
      encounter.examinerId = newClinician.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: oldClinician.id,
        encounterType: 'admission',
      });

      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: newClinician.id,
        encounterType: 'admission',
      });
    });

    it('migrates changelog with encounter_type change', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const department = await createDepartment('department');
      const clinician = await createUser('testUser');
      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'admission',
        startDate: getDateSubtractedFromNow(6),
      });
      await onEncounterProgression(
        models,
        encounter.id,
        'admission',
        'clinic',
        getCurrentDateTimeString(),
      );
      encounter.encounterType = 'clinic';
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'admission',
      });

      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'clinic',
      });
    });
  });

  describe('with multiple changes', () => {
    beforeEach(async () => {
      await clearTestData();
    });

    it('migrates changelog with multiple different changes', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const oldLocation = await createLocation('oldLocation');
      const newLocation = await createLocation('newLocation');
      const oldDepartment = await createDepartment('oldDepartment');
      const newDepartment = await createDepartment('newDepartment');
      const oldUser = await createUser('oldUser');
      const newUser = await createUser('newUser');
      const oldEncounterType = 'admission';
      const newEncounterType = 'clinic';

      const encounter = await createEncounter(patient, {
        departmentId: oldDepartment.id,
        locationId: oldLocation.id,
        examinerId: oldUser.id,
        encounterType: oldEncounterType,
        startDate: getDateSubtractedFromNow(8),
      });

      // Change location
      await addLocationChangeNote(
        models,
        encounter.id,
        oldLocation.id,
        newLocation.id,
        getDateSubtractedFromNow(6),
      );
      encounter.locationId = newLocation.id;
      await encounter.save();

      // Change department
      await addDepartmentChangeNote(
        models,
        encounter.id,
        oldDepartment.id,
        newDepartment.id,
        getDateSubtractedFromNow(5),
      );
      encounter.departmentId = newDepartment.id;
      await encounter.save();

      // Change clinician
      await updateClinician(
        models,
        encounter.id,
        oldUser.id,
        newUser.id,
        getDateSubtractedFromNow(4),
      );
      encounter.examinerId = newUser.id;
      await encounter.save();

      // Change encounter type
      await onEncounterProgression(
        models,
        encounter.id,
        oldEncounterType,
        newEncounterType,
        getDateSubtractedFromNow(3),
      );
      encounter.encounterType = newEncounterType;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: oldDepartment.id,
        locationId: oldLocation.id,
        examinerId: oldUser.id,
        encounterType: oldEncounterType,
      });

      // Location change history
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: oldDepartment.id,
        locationId: newLocation.id,
        examinerId: oldUser.id,
        encounterType: oldEncounterType,
      });

      // Department change history
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: newDepartment.id,
        locationId: newLocation.id,
        examinerId: oldUser.id,
        encounterType: oldEncounterType,
      });

      // Clinician change history
      expect(encounterHistoryRecords[3]).toMatchObject({
        encounterId: encounter.id,
        departmentId: newDepartment.id,
        locationId: newLocation.id,
        examinerId: newUser.id,
        encounterType: oldEncounterType,
      });

      // Encounter type change history
      expect(encounterHistoryRecords[4]).toMatchObject({
        encounterId: encounter.id,
        departmentId: newDepartment.id,
        locationId: newLocation.id,
        examinerId: newUser.id,
        encounterType: newEncounterType,
      });
    });

    it('migrates changelog with multiple location changes', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location1 = await createLocation('location1');
      const location2 = await createLocation('location2');
      const location3 = await createLocation('location3');
      const location4 = await createLocation('location4');

      const department = await createDepartment('department');
      const clinician = await createUser('testUser');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location1.id,
        examinerId: clinician.id,
        encounterType,
        startDate: getDateSubtractedFromNow(8),
      });

      // Change location 1
      await addLocationChangeNote(
        models,
        encounter.id,
        location1.id,
        location2.id,
        getDateSubtractedFromNow(6),
      );
      encounter.locationId = location2.id;
      await encounter.save();

      // Change location 2
      await addLocationChangeNote(
        models,
        encounter.id,
        location2.id,
        location3.id,
        getDateSubtractedFromNow(5),
      );
      encounter.locationId = location3.id;
      await encounter.save();

      // Change location 3
      await addLocationChangeNote(
        models,
        encounter.id,
        location3.id,
        location4.id,
        getDateSubtractedFromNow(4),
      );
      encounter.locationId = location4.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location1.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Location change history 1
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location2.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Location change history 2
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location3.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Location change history 3
      expect(encounterHistoryRecords[3]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location4.id,
        examinerId: clinician.id,
        encounterType,
      });
    });

    it('migrates changelog with multiple department changes', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const department1 = await createDepartment('department1');
      const department2 = await createDepartment('department2');
      const department3 = await createDepartment('department3');
      const department4 = await createDepartment('department4');
      const clinician = await createUser('testUser');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department1.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
        startDate: getDateSubtractedFromNow(8),
      });

      // Change department 1
      await addDepartmentChangeNote(
        models,
        encounter.id,
        department1.id,
        department2.id,
        getDateSubtractedFromNow(6),
      );
      encounter.departmentId = department2.id;
      await encounter.save();

      // Change department 2
      await addDepartmentChangeNote(
        models,
        encounter.id,
        department2.id,
        department3.id,
        getDateSubtractedFromNow(5),
      );
      encounter.departmentId = department3.id;
      await encounter.save();

      // Change department 3
      await addDepartmentChangeNote(
        models,
        encounter.id,
        department3.id,
        department4.id,
        getDateSubtractedFromNow(4),
      );
      encounter.departmentId = department4.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original department
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department1.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Department change history 1
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department2.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Department change history 2
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department3.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Department change history 3
      expect(encounterHistoryRecords[3]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department4.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
      });
    });

    it('migrates changelog with multiple clinician changes', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const department = await createDepartment('department');
      const clinician1 = await createUser('testUser1');
      const clinician2 = await createUser('testUser2');
      const clinician3 = await createUser('testUser3');
      const clinician4 = await createUser('testUser4');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician1.id,
        encounterType,
        startDate: getDateSubtractedFromNow(8),
      });

      // Change clinician 1
      await updateClinician(
        models,
        encounter.id,
        clinician1.id,
        clinician2.id,
        getDateSubtractedFromNow(6),
      );
      encounter.examinerId = clinician2.id;
      await encounter.save();

      // Change clinician 2
      await updateClinician(
        models,
        encounter.id,
        clinician2.id,
        clinician3.id,
        getDateSubtractedFromNow(5),
      );
      encounter.examinerId = clinician3.id;
      await encounter.save();

      // Change clinician 3
      await updateClinician(
        models,
        encounter.id,
        clinician3.id,
        clinician4.id,
        getDateSubtractedFromNow(4),
      );
      encounter.examinerId = clinician4.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician1.id,
        encounterType,
      });

      // Clinician change history 1
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician2.id,
        encounterType,
      });

      // Clinician change history 2
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician3.id,
        encounterType,
      });

      // Clinician change history 3
      expect(encounterHistoryRecords[3]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician4.id,
        encounterType,
      });
    });

    it('migrates changelog with multiple encounter_type changes', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const department = await createDepartment('department');
      const clinician = await createUser('testUser');
      const encounterType1 = 'triage';
      const encounterType2 = 'observation';
      const encounterType3 = 'admission';
      const encounterType4 = 'clinic';

      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: encounterType1,
        startDate: getDateSubtractedFromNow(8),
      });

      // Change encounter type 1
      await onEncounterProgression(
        models,
        encounter.id,
        encounterType1,
        encounterType2,
        getDateSubtractedFromNow(6),
      );
      encounter.encounterType = encounterType2;
      await encounter.save();

      // Change encounter type 2
      await onEncounterProgression(
        models,
        encounter.id,
        encounterType2,
        encounterType3,
        getDateSubtractedFromNow(5),
      );
      encounter.encounterType = encounterType3;
      await encounter.save();

      // Change encounter type 3
      await onEncounterProgression(
        models,
        encounter.id,
        encounterType3,
        encounterType4,
        getDateSubtractedFromNow(4),
      );
      encounter.encounterType = encounterType4;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: encounterType1,
      });

      // Encounter type change history 1
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: encounterType2,
      });

      // Encounter type change history 2
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: encounterType3,
      });

      // Encounter type change history 3
      expect(encounterHistoryRecords[3]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: encounterType4,
      });
    });

    it('migrates changelog with multiple mixed changes', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location1 = await createLocation('location1');
      const location2 = await createLocation('location2');
      const location3 = await createLocation('location3');

      const department1 = await createDepartment('department1');
      const department2 = await createDepartment('department2');
      const department3 = await createDepartment('department3');

      const clinician1 = await createUser('testUser1');
      const clinician2 = await createUser('testUser2');

      const encounterType1 = 'triage';
      const encounterType2 = 'observation';
      const encounterType3 = 'admission';
      const encounterType4 = 'clinic';

      const encounter = await createEncounter(patient, {
        departmentId: department1.id,
        locationId: location1.id,
        examinerId: clinician1.id,
        encounterType: encounterType1,
        startDate: getDateSubtractedFromNow(14),
      });

      await addLocationChangeNote(
        models,
        encounter.id,
        location1.id,
        location2.id,
        getDateSubtractedFromNow(13),
      );
      encounter.locationId = location2.id;
      await encounter.save();

      await onEncounterProgression(
        models,
        encounter.id,
        encounterType1,
        encounterType2,
        getDateSubtractedFromNow(12),
      );
      encounter.encounterType = encounterType2;
      await encounter.save();

      await onEncounterProgression(
        models,
        encounter.id,
        encounterType2,
        encounterType3,
        getDateSubtractedFromNow(11),
      );
      encounter.encounterType = encounterType3;
      await encounter.save();

      await addLocationChangeNote(
        models,
        encounter.id,
        location2.id,
        location3.id,
        getDateSubtractedFromNow(10),
      );
      encounter.locationId = location3.id;
      await encounter.save();

      await addDepartmentChangeNote(
        models,
        encounter.id,
        department1.id,
        department2.id,
        getDateSubtractedFromNow(9),
      );
      encounter.departmentId = department2.id;
      await encounter.save();

      await addDepartmentChangeNote(
        models,
        encounter.id,
        department2.id,
        department3.id,
        getDateSubtractedFromNow(8),
      );
      encounter.departmentId = department3.id;
      await encounter.save();

      await updateClinician(
        models,
        encounter.id,
        clinician1.id,
        clinician2.id,
        getDateSubtractedFromNow(7),
      );
      encounter.examinerId = clinician2.id;
      await encounter.save();

      await onEncounterProgression(
        models,
        encounter.id,
        encounterType3,
        encounterType4,
        getDateSubtractedFromNow(6),
      );
      encounter.encounterType = encounterType4;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department1.id,
        locationId: location1.id,
        examinerId: clinician1.id,
        encounterType: encounterType1,
      });

      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department1.id,
        locationId: location2.id,
        examinerId: clinician1.id,
        encounterType: encounterType1,
      });

      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department1.id,
        locationId: location2.id,
        examinerId: clinician1.id,
        encounterType: encounterType2,
      });

      expect(encounterHistoryRecords[3]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department1.id,
        locationId: location2.id,
        examinerId: clinician1.id,
        encounterType: encounterType3,
      });

      expect(encounterHistoryRecords[4]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department1.id,
        locationId: location3.id,
        examinerId: clinician1.id,
        encounterType: encounterType3,
      });

      expect(encounterHistoryRecords[5]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department2.id,
        locationId: location3.id,
        examinerId: clinician1.id,
        encounterType: encounterType3,
      });

      expect(encounterHistoryRecords[6]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department3.id,
        locationId: location3.id,
        examinerId: clinician1.id,
        encounterType: encounterType3,
      });

      expect(encounterHistoryRecords[7]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department3.id,
        locationId: location3.id,
        examinerId: clinician2.id,
        encounterType: encounterType3,
      });

      expect(encounterHistoryRecords[8]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department3.id,
        locationId: location3.id,
        examinerId: clinician2.id,
        encounterType: encounterType4,
      });
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await clearTestData();
    });

    it('migrates changelog with duplicated location names in a location group', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location1 = await createLocation('location same name', {
        locationGroupId: locationGroup1.id,
      });
      const location2 = await createLocation('location same name', {
        locationGroupId: locationGroup2.id,
      });
      const department = await createDepartment('department');
      const clinician = await createUser('user');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location1.id,
        examinerId: clinician.id,
        encounterType,
        startDate: getDateSubtractedFromNow(6),
      });

      // Change location
      await addLocationChangeNote(
        models,
        encounter.id,
        location1.id,
        location2.id,
        getDateSubtractedFromNow(3),
      );
      encounter.locationId = location2.id;
      await encounter.save();

      // Migration
      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords).toHaveLength(2);

      // Original encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location1.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Location change history
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location2.id,
        examinerId: clinician.id,
        encounterType,
      });
    });

    it('replaces duplicated location names in a location group with placeholder location', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location1 = await createLocation('location same name', {
        locationGroupId: locationGroup1.id,
      });
      const location2 = await createLocation('location same name', {
        locationGroupId: locationGroup1.id,
      });
      const location3 = await createLocation('location same name', {
        locationGroupId: locationGroup2.id,
      });
      const department = await createDepartment('department');
      const clinician = await createUser('user');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location1.id,
        examinerId: clinician.id,
        encounterType,
        startDate: getDateSubtractedFromNow(6),
      });

      // Change location
      await addLocationChangeNote(
        models,
        encounter.id,
        location1.id,
        location2.id,
        getDateSubtractedFromNow(3),
      );
      encounter.locationId = location2.id;
      await encounter.save();

      // Change location
      await addLocationChangeNote(
        models,
        encounter.id,
        location2.id,
        location3.id,
        getDateSubtractedFromNow(1),
      );
      encounter.locationId = location3.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords).toHaveLength(3);

      // Latest encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: placeholderLocation.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Latest encounter
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: placeholderLocation.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Latest encounter
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location3.id,
        examinerId: clinician.id,
        encounterType,
      });
    });

    it('replaces duplicated department names in a facility with placeholder deparment', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const department1 = await createDepartment('department same name', {
        facilityId: facility1.id,
      });
      const department2 = await createDepartment('department same name', {
        facilityId: facility1.id,
      });
      const department3 = await createDepartment('department 3', {
        facilityId: facility1.id,
      });

      const location = await createLocation('location');
      const clinician = await createUser('user');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department1.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
        startDate: getDateSubtractedFromNow(6),
      });

      // Change department 1
      await addDepartmentChangeNote(
        models,
        encounter.id,
        department1.id,
        department2.id,
        getDateSubtractedFromNow(4),
      );
      encounter.departmentId = department2.id;
      await encounter.save();

      // Change department 2
      await addDepartmentChangeNote(
        models,
        encounter.id,
        department2.id,
        department3.id,
        getDateSubtractedFromNow(2),
      );
      encounter.departmentId = department3.id;
      await encounter.save();

      // Migration
      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords).toHaveLength(3);

      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: placeholderDepartment.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
      });

      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: placeholderDepartment.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
      });

      // Latest encounter
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department3.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType,
      });
    });

    it('replaces duplicated clinician names in a facility with placeholder clinician', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const clinician1 = await createUser('clinician same name');
      const clinician2 = await createUser('clinician same name');
      const clinician3 = await createUser('clinician 3');
      const department = await createDepartment('department');
      const location = await createLocation('location');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician1.id,
        encounterType,
        startDate: getDateSubtractedFromNow(6),
      });

      // Change clinician 1
      await updateClinician(
        models,
        encounter.id,
        clinician1.id,
        clinician2.id,
        getDateSubtractedFromNow(4),
      );
      encounter.examinerId = clinician2.id;
      await encounter.save();

      // Change clinician 2
      await updateClinician(
        models,
        encounter.id,
        clinician2.id,
        clinician3.id,
        getDateSubtractedFromNow(2),
      );
      encounter.examinerId = clinician3.id;
      await encounter.save();

      // Migration
      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords).toHaveLength(3);

      // 1st encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: placeholderUser.id,
        encounterType,
      });

      // 2nd encounter
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: placeholderUser.id,
        encounterType,
      });

      // Latest encounter
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician3.id,
        encounterType,
      });
    });

    it('creates encounter_history for encounter that does not have changelog', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const clinician1 = await createUser('Clinician 1');
      const clinician2 = await createUser('Clinician 2');
      const department = await createDepartment('department');
      const location = await createLocation('location');
      const encounterType = 'admission';

      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician1.id,
        encounterType,
        startDate: getDateSubtractedFromNow(6),
      });

      // Change clinician 1
      await updateClinician(
        models,
        encounter.id,
        clinician1.id,
        clinician2.id,
        getDateSubtractedFromNow(4),
      );
      encounter.examinerId = clinician2.id;
      await encounter.save();

      await models.LegacyNotePage.createForRecord(
        encounter.id,
        NOTE_RECORD_TYPES.ENCOUNTER,
        NOTE_TYPES.SYSTEM,
        'Automatically discharged',
        clinician1.id,
      );

      // Migration
      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords).toHaveLength(2);

      // 1st encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician1.id,
        encounterType,
      });

      // Latest encounter
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician2.id,
        encounterType,
      });
    });

    it('creates encounter_history for encounter that does not have any notes', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const clinician1 = await createUser('Clinician 1');
      const clinician2 = await createUser('Clinician 2');
      const clinician3 = await createUser('Clinician 3');

      const department1 = await createDepartment('department1');
      const department2 = await createDepartment('department2');
      const department3 = await createDepartment('department3');

      const location1 = await createLocation('location1');
      const location2 = await createLocation('location2');
      const location3 = await createLocation('location3');

      const encounterType = 'admission';

      const encounter1 = await createEncounter(patient, {
        departmentId: department1.id,
        locationId: location1.id,
        examinerId: clinician1.id,
        encounterType,
        startDate: getDateSubtractedFromNow(6),
      });

      const encounter2 = await createEncounter(patient, {
        departmentId: department2.id,
        locationId: location2.id,
        examinerId: clinician2.id,
        encounterType,
        startDate: getDateSubtractedFromNow(4),
      });

      const encounter3 = await createEncounter(patient, {
        departmentId: department3.id,
        locationId: location3.id,
        examinerId: clinician3.id,
        encounterType,
        startDate: getDateSubtractedFromNow(2),
      });

      // Migration
      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords).toHaveLength(3);

      // 1st encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter1.id,
        departmentId: department1.id,
        locationId: location1.id,
        examinerId: clinician1.id,
        encounterType,
      });

      // 2nd encounter
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter2.id,
        departmentId: department2.id,
        locationId: location2.id,
        examinerId: clinician2.id,
        encounterType,
      });

      // 3rd encounter
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter3.id,
        departmentId: department3.id,
        locationId: location3.id,
        examinerId: clinician3.id,
        encounterType,
      });
    });

    it('does not create encounter_history for migrated encounter when running sub command again', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const clinician1 = await createUser('Clinician 1');
      const clinician2 = await createUser('Clinician 2');
      const clinician3 = await createUser('Clinician 3');

      const department1 = await createDepartment('department1');
      const department2 = await createDepartment('department2');
      const department3 = await createDepartment('department3');

      const location1 = await createLocation('location1');
      const location2 = await createLocation('location2');
      const location3 = await createLocation('location3');

      const encounterType = 'admission';

      const encounter1 = await createEncounter(patient, {
        departmentId: department1.id,
        locationId: location1.id,
        examinerId: clinician1.id,
        encounterType,
        startDate: getDateSubtractedFromNow(6),
      });

      const encounter2 = await createEncounter(patient, {
        departmentId: department2.id,
        locationId: location2.id,
        examinerId: clinician2.id,
        encounterType,
        startDate: getDateSubtractedFromNow(4),
      });

      const encounter3 = await createEncounter(patient, {
        departmentId: department3.id,
        locationId: location3.id,
        examinerId: clinician3.id,
        encounterType,
        startDate: getDateSubtractedFromNow(2),
      });

      // Migration 1
      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      // Migration 2
      await migrateChangelogNotesToEncounterHistory(SUB_COMMAND_OPTIONS);

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords).toHaveLength(3);

      // 1st encounter
      expect(encounterHistoryRecords[0]).toMatchObject({
        encounterId: encounter1.id,
        departmentId: department1.id,
        locationId: location1.id,
        examinerId: clinician1.id,
        encounterType,
      });

      // 2nd encounter
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter2.id,
        departmentId: department2.id,
        locationId: location2.id,
        examinerId: clinician2.id,
        encounterType,
      });

      // 3rd encounter
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter3.id,
        departmentId: department3.id,
        locationId: location3.id,
        examinerId: clinician3.id,
        encounterType,
      });
    });
  });
});
