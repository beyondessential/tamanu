import { sub } from 'date-fns';
import { Op } from 'sequelize';

import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';
import { EncounterChangeType, NOTE_RECORD_TYPES, NOTE_TYPES, SYSTEM_USER_UUID } from '@tamanu/constants';

import { createTestContext } from '../utilities';
import { migrateDataInBatches } from '../../dist/subCommands/migrateDataInBatches/migrateDataInBatches';

const addSystemNote = async (models, recordId, content, date, user) =>
  models.Note.create({
    recordId,
    recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    date,
    noteTypeId: NOTE_TYPES.SYSTEM,
    content,
    authorId: user?.id || SYSTEM_USER_UUID,
  });

const addLocationChangeNote = async (
  models,
  recordId,
  oldLocationId,
  newLocationId,
  submittedTime,
  user,
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

  const args = [
    models,
    recordId,
    `Changed location from ${Location.formatFullLocationName(
      oldLocation,
    )} to ${Location.formatFullLocationName(newLocation)}`,
    submittedTime,
    user,
  ];

  return addSystemNote(...args);
};

const addDepartmentChangeNote = async (
  models,
  recordId,
  fromDepartmentId,
  toDepartmentId,
  submittedTime,
  user,
) => {
  const { Department } = models;
  const oldDepartment = await Department.findOne({ where: { id: fromDepartmentId } });
  const newDepartment = await Department.findOne({ where: { id: toDepartmentId } });
  const args = [
    models,
    recordId,
    `Changed department from ${oldDepartment.name} to ${newDepartment.name}`,
    submittedTime,
    user,
  ];

  return addSystemNote(...args);
};

const updateClinician = async (
  models,
  recordId,
  oldClinicianId,
  newClinicianId,
  submittedTime,
  user,
) => {
  const { User } = models;
  const oldClinician = await User.findOne({ where: { id: oldClinicianId } });
  const newClinician = await User.findOne({ where: { id: newClinicianId } });
  const args = [
    models,
    recordId,
    `Changed supervising clinician from ${oldClinician.displayName} to ${newClinician.displayName}`,
    submittedTime,
    user,
  ];

  return addSystemNote(...args);
};

const onEncounterProgression = async (
  models,
  recordId,
  oldEncounterType,
  newEncounterType,
  submittedTime,
  user,
) => {
  const args = [
    models,
    recordId,
    `Changed type from ${oldEncounterType} to ${newEncounterType}`,
    submittedTime,
    user,
  ];

  return addSystemNote(...args);
};

describe('migrateChangelogNotesToEncounterHistory', () => {
  let ctx;
  let models;
  let patient;
  let facility1;
  let locationGroup1;

  const NOTE_SUB_COMMAND_NAME = 'ChangelogNotesToEncounterHistory';

  const getDateSubtractedFromNow = (daysToSubtract) =>
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
    await models.Location.truncate({
      cascade: true,
      force: true,
    });
    await models.Department.truncate({
      cascade: true,
      force: true,
    });
    await models.Note.truncate({ cascade: true, force: true });
    await models.User.destroy({
      cascade: true,
      force: true,
      where: {
        id: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
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

    locationGroup1 = await models.LocationGroup.create({
      code: 'ward-1',
      name: 'Ward 1',
      facilityId: facility1.id,
    });
  });

  afterAll(() => ctx.close());

  describe('with new note schema', () => {
    beforeEach(async () => {
      await clearTestData();
    });

    it('migrates Notes to EncounterHistory properly with single change', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const oldLocation = await createLocation('oldLocation');
      const newLocation = await createLocation('newLocation');
      const department = await createDepartment('department');
      const clinician = await createUser('testUser');
      const locationChangeNoteDate = getCurrentDateTimeString();
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
        locationChangeNoteDate,
        null,
        true,
      );
      encounter.locationId = newLocation.id;
      await encounter.save();

      await migrateDataInBatches(NOTE_SUB_COMMAND_NAME, {
        batchSize: 1,
        delay: 0,
        noteSchema: 'note',
      });

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
        changeType: null,
        actorId: null,
        date: encounter.startDate,
      });

      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: department.id,
        locationId: newLocation.id,
        examinerId: clinician.id,
        encounterType: 'admission',
        changeType: EncounterChangeType.Location,
        actorId: SYSTEM_USER_UUID,
        date: locationChangeNoteDate,
      });
    });

    it('migrates Notes to EncounterHistory properly with multiple changes', async () => {
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
        null,
        true, // new note schema
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
        null,
        true, // new note schema
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
        null,
        true, // new note schema
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
        null,
        true, // new note schema
      );
      encounter.encounterType = newEncounterType;
      await encounter.save();

      await migrateDataInBatches(NOTE_SUB_COMMAND_NAME, {
        batchSize: 1,
        delay: 0,
        noteSchema: 'note',
      });

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
        changeType: null,
        actorId: null,
      });

      // Location change history
      expect(encounterHistoryRecords[1]).toMatchObject({
        encounterId: encounter.id,
        departmentId: oldDepartment.id,
        locationId: newLocation.id,
        examinerId: oldUser.id,
        encounterType: oldEncounterType,
        changeType: EncounterChangeType.Location,
        actorId: SYSTEM_USER_UUID,
      });

      // Department change history
      expect(encounterHistoryRecords[2]).toMatchObject({
        encounterId: encounter.id,
        departmentId: newDepartment.id,
        locationId: newLocation.id,
        examinerId: oldUser.id,
        encounterType: oldEncounterType,
        changeType: EncounterChangeType.Department,
        actorId: SYSTEM_USER_UUID,
      });

      // Clinician change history
      expect(encounterHistoryRecords[3]).toMatchObject({
        encounterId: encounter.id,
        departmentId: newDepartment.id,
        locationId: newLocation.id,
        examinerId: newUser.id,
        encounterType: oldEncounterType,
        changeType: EncounterChangeType.Examiner,
        actorId: SYSTEM_USER_UUID,
      });

      // Encounter type change history
      expect(encounterHistoryRecords[4]).toMatchObject({
        encounterId: encounter.id,
        departmentId: newDepartment.id,
        locationId: newLocation.id,
        examinerId: newUser.id,
        encounterType: newEncounterType,
        changeType: EncounterChangeType.EncounterType,
        actorId: SYSTEM_USER_UUID,
      });
    });
  });
});
