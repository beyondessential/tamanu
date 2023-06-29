import { sub } from 'date-fns';

import { createDummyEncounter, createDummyPatient } from 'shared/demoData/patients';
import { fake } from 'shared/test-helpers/fake';

import { createTestContext } from '../utilities';
import { migrateChangelogNotesToEncounterHistory } from '../../app/subCommands';
import { toDateTimeString, getCurrentDateTimeString } from '../../../shared/src/utils/dateTime';

describe('migrateChangelogNotesToEncounterHistory', () => {
  let ctx;
  let models;
  let patient;
  let facility;
  let locationGroup;

  const createEncounter = async (encounterPatient, overrides = {}) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: encounterPatient.id,
      ...overrides,
    });

    return encounter;
  };

  const createLocation = async locationName => {
    return models.Location.create(
      fake(models.Location, {
        name: locationName,
        facilityId: facility.id,
        locationGroupId: locationGroup.id,
      }),
    );
  };

  const createDepartment = async departmentName => {
    return models.Department.create(
      fake(models.Department, { name: departmentName, facilityId: facility.id }),
    );
  };

  const createUser = async clinicianName => {
    return models.User.create(
      fake(models.User, {
        displayName: clinicianName,
      }),
    );
  };

  const clearTestData = async () => {
    await models.EncounterHistory.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
    await models.Location.truncate({ cascade: true, force: true });
    await models.Department.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.NoteItem.truncate({ cascade: true, force: true });
    await models.NotePage.truncate({ cascade: true, force: true });
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
  });

  afterAll(() => ctx.close());

  describe('with single change', () => {
    beforeEach(async () => {
      await clearTestData();
    });

    it('migrates change log with location change', async () => {
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
      });
      await encounter.addLocationChangeNote(
        'Changed location',
        newLocation.id,
        getCurrentDateTimeString(),
      );
      encounter.locationId = newLocation.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0].locationId).toEqual(oldLocation.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual('admission');

      expect(encounterHistoryRecords[1].locationId).toEqual(newLocation.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual('admission');
    });

    it('migrates change log with department change', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const oldDepartment = await createDepartment('oldDepartment');
      const newDepartment = await createDepartment('newDepartment');
      const clinician = await createUser('testUser2');
      const encounter = await createEncounter(patient, {
        departmentId: oldDepartment.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'admission',
      });
      await encounter.addDepartmentChangeNote(newDepartment.id, getCurrentDateTimeString());
      encounter.departmentId = newDepartment.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(oldDepartment.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual('admission');

      expect(encounterHistoryRecords[1].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(newDepartment.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual('admission');
    });

    it('migrates change log with clinician change', async () => {
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
      });
      await encounter.updateClinician(newClinician.id, getCurrentDateTimeString());
      encounter.examinerId = newClinician.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(oldClinician.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual('admission');

      expect(encounterHistoryRecords[1].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(newClinician.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual('admission');
    });

    it('migrates change log with encounter_type change', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const location = await createLocation('location');
      const department = await createDepartment('department');
      const clinician = await createUser('testUser');
      const encounter = await createEncounter(patient, {
        departmentId: department.id,
        locationId: location.id,
        examinerId: clinician.id,
        encounterType: 'admission',
      });
      await encounter.onEncounterProgression('clinic', getCurrentDateTimeString());
      encounter.encounterType = 'clinic';
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      expect(encounterHistoryRecords[0].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual('admission');

      expect(encounterHistoryRecords[1].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual('clinic');
    });
  });

  describe('with multiple changes', () => {
    beforeEach(async () => {
      await clearTestData();
    });

    it('migrates change log with multiple different changes', async () => {
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
      });

      // Change location
      await encounter.addLocationChangeNote(
        'Changed location',
        newLocation.id,
        toDateTimeString(sub(new Date(), { days: 6 })),
      );
      encounter.locationId = newLocation.id;
      await encounter.save();

      // Change department
      await encounter.addDepartmentChangeNote(
        newDepartment.id,
        toDateTimeString(sub(new Date(), { days: 5 })),
      );
      encounter.departmentId = newDepartment.id;
      await encounter.save();

      // Change clinician
      await encounter.updateClinician(newUser.id, toDateTimeString(sub(new Date(), { days: 4 })));
      encounter.examinerId = newUser.id;
      await encounter.save();

      // Change encounter type
      await encounter.onEncounterProgression(
        newEncounterType,
        toDateTimeString(sub(new Date(), { days: 3 })),
      );
      encounter.encounterType = newEncounterType;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0].locationId).toEqual(oldLocation.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(oldDepartment.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(oldUser.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual(oldEncounterType);

      // Change location
      expect(encounterHistoryRecords[1].locationId).toEqual(newLocation.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(oldDepartment.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(oldUser.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual(oldEncounterType);

      // Change department
      expect(encounterHistoryRecords[2].locationId).toEqual(newLocation.id);
      expect(encounterHistoryRecords[2].departmentId).toEqual(newDepartment.id);
      expect(encounterHistoryRecords[2].examinerId).toEqual(oldUser.id);
      expect(encounterHistoryRecords[2].encounterType).toEqual(oldEncounterType);

      // Change clinician
      expect(encounterHistoryRecords[3].locationId).toEqual(newLocation.id);
      expect(encounterHistoryRecords[3].departmentId).toEqual(newDepartment.id);
      expect(encounterHistoryRecords[3].examinerId).toEqual(newUser.id);
      expect(encounterHistoryRecords[3].encounterType).toEqual(oldEncounterType);

      // Change encounter type
      expect(encounterHistoryRecords[4].locationId).toEqual(newLocation.id);
      expect(encounterHistoryRecords[4].departmentId).toEqual(newDepartment.id);
      expect(encounterHistoryRecords[4].examinerId).toEqual(newUser.id);
      expect(encounterHistoryRecords[4].encounterType).toEqual(newEncounterType);
    });

    it('migrates change log with multiple location changes', async () => {
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
      });

      // Change location 1
      await encounter.addLocationChangeNote(
        'Changed location',
        location2.id,
        toDateTimeString(sub(new Date(), { days: 6 })),
      );
      encounter.locationId = location2.id;
      await encounter.save();

      // Change location 2
      await encounter.addLocationChangeNote(
        'Changed location',
        location3.id,
        toDateTimeString(sub(new Date(), { days: 5 })),
      );
      encounter.locationId = location3.id;
      await encounter.save();

      // Change location 3
      await encounter.addLocationChangeNote(
        'Changed location',
        location4.id,
        toDateTimeString(sub(new Date(), { days: 4 })),
      );
      encounter.locationId = location4.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0].locationId).toEqual(location1.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual(encounterType);

      // Change location 1
      expect(encounterHistoryRecords[1].locationId).toEqual(location2.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual(encounterType);

      // Change location 2
      expect(encounterHistoryRecords[2].locationId).toEqual(location3.id);
      expect(encounterHistoryRecords[2].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[2].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[2].encounterType).toEqual(encounterType);

      // Change location 3
      expect(encounterHistoryRecords[3].locationId).toEqual(location4.id);
      expect(encounterHistoryRecords[3].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[3].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[3].encounterType).toEqual(encounterType);
    });

    it('migrates change log with multiple department changes', async () => {
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
      });

      // Change department 1
      await encounter.addDepartmentChangeNote(
        department2.id,
        toDateTimeString(sub(new Date(), { days: 6 })),
      );
      encounter.departmentId = department2.id;
      await encounter.save();

      // Change department 2
      await encounter.addDepartmentChangeNote(
        department3.id,
        toDateTimeString(sub(new Date(), { days: 5 })),
      );
      encounter.departmentId = department3.id;
      await encounter.save();

      // Change department 3
      await encounter.addDepartmentChangeNote(
        department4.id,
        toDateTimeString(sub(new Date(), { days: 4 })),
      );
      encounter.departmentId = department4.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original department
      expect(encounterHistoryRecords[0].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department1.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual(encounterType);

      // Change department 1
      expect(encounterHistoryRecords[1].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department2.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual(encounterType);

      // Change department 2
      expect(encounterHistoryRecords[2].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[2].departmentId).toEqual(department3.id);
      expect(encounterHistoryRecords[2].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[2].encounterType).toEqual(encounterType);

      // Change department 3
      expect(encounterHistoryRecords[3].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[3].departmentId).toEqual(department4.id);
      expect(encounterHistoryRecords[3].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[3].encounterType).toEqual(encounterType);
    });

    it('migrates change log with multiple clinician changes', async () => {
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
      });

      // Change clinician 1
      await encounter.updateClinician(
        clinician2.id,
        toDateTimeString(sub(new Date(), { days: 6 })),
      );
      encounter.examinerId = clinician2.id;
      await encounter.save();

      // Change clinician 2
      await encounter.updateClinician(
        clinician3.id,
        toDateTimeString(sub(new Date(), { days: 5 })),
      );
      encounter.examinerId = clinician3.id;
      await encounter.save();

      // Change clinician 3
      await encounter.updateClinician(
        clinician4.id,
        toDateTimeString(sub(new Date(), { days: 4 })),
      );
      encounter.examinerId = clinician4.id;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual(encounterType);

      // Change clinician 1
      expect(encounterHistoryRecords[1].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician2.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual(encounterType);

      // Change clinician 2
      expect(encounterHistoryRecords[2].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[2].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[2].examinerId).toEqual(clinician3.id);
      expect(encounterHistoryRecords[2].encounterType).toEqual(encounterType);

      // Change clinician 3
      expect(encounterHistoryRecords[3].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[3].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[3].examinerId).toEqual(clinician4.id);
      expect(encounterHistoryRecords[3].encounterType).toEqual(encounterType);
    });

    it('migrates change log with multiple encounter_type changes', async () => {
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
      });

      // Change encounter type 1
      await encounter.onEncounterProgression(
        encounterType2,
        toDateTimeString(sub(new Date(), { days: 6 })),
      );
      encounter.encounterType = encounterType2;
      await encounter.save();

      // Change encounter type 2
      await encounter.onEncounterProgression(
        encounterType3,
        toDateTimeString(sub(new Date(), { days: 5 })),
      );
      encounter.encounterType = encounterType3;
      await encounter.save();

      // Change encounter type 3
      await encounter.onEncounterProgression(
        encounterType4,
        toDateTimeString(sub(new Date(), { days: 4 })),
      );
      encounter.encounterType = encounterType4;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual(encounterType1);

      // Change encounter type 1
      expect(encounterHistoryRecords[1].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual(encounterType2);

      // Change encounter type 2
      expect(encounterHistoryRecords[2].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[2].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[2].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[2].encounterType).toEqual(encounterType3);

      // Change encounter type 3
      expect(encounterHistoryRecords[3].locationId).toEqual(location.id);
      expect(encounterHistoryRecords[3].departmentId).toEqual(department.id);
      expect(encounterHistoryRecords[3].examinerId).toEqual(clinician.id);
      expect(encounterHistoryRecords[3].encounterType).toEqual(encounterType4);
    });

    it('migrates change log with multiple mixed changes', async () => {
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
      });

      await encounter.addLocationChangeNote(
        'Changed location',
        location2.id,
        toDateTimeString(sub(new Date(), { days: 13 })),
      );
      encounter.locationId = location2.id;
      await encounter.save();

      await encounter.onEncounterProgression(
        encounterType2,
        toDateTimeString(sub(new Date(), { days: 12 })),
      );
      encounter.encounterType = encounterType2;
      await encounter.save();

      await encounter.onEncounterProgression(
        encounterType3,
        toDateTimeString(sub(new Date(), { days: 11 })),
      );
      encounter.encounterType = encounterType3;
      await encounter.save();

      await encounter.addLocationChangeNote(
        'Changed location',
        location3.id,
        toDateTimeString(sub(new Date(), { days: 10 })),
      );
      encounter.locationId = location3.id;
      await encounter.save();

      await encounter.addDepartmentChangeNote(
        department2.id,
        toDateTimeString(sub(new Date(), { days: 9 })),
      );
      encounter.departmentId = department2.id;
      await encounter.save();

      await encounter.addDepartmentChangeNote(
        department3.id,
        toDateTimeString(sub(new Date(), { days: 8 })),
      );
      encounter.departmentId = department3.id;
      await encounter.save();

      await encounter.updateClinician(
        clinician2.id,
        toDateTimeString(sub(new Date(), { days: 7 })),
      );
      encounter.examinerId = clinician2.id;
      await encounter.save();

      await encounter.onEncounterProgression(
        encounterType4,
        toDateTimeString(sub(new Date(), { days: 6 })),
      );
      encounter.encounterType = encounterType4;
      await encounter.save();

      await migrateChangelogNotesToEncounterHistory();

      expect(exitSpy).toBeCalledWith(0);

      const encounterHistoryRecords = await models.EncounterHistory.findAll({
        order: [['date', 'ASC']],
      });

      // Original encounter
      expect(encounterHistoryRecords[0].locationId).toEqual(location1.id);
      expect(encounterHistoryRecords[0].departmentId).toEqual(department1.id);
      expect(encounterHistoryRecords[0].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[0].encounterType).toEqual(encounterType1);

      expect(encounterHistoryRecords[1].locationId).toEqual(location2.id);
      expect(encounterHistoryRecords[1].departmentId).toEqual(department1.id);
      expect(encounterHistoryRecords[1].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[1].encounterType).toEqual(encounterType1);

      expect(encounterHistoryRecords[2].locationId).toEqual(location2.id);
      expect(encounterHistoryRecords[2].departmentId).toEqual(department1.id);
      expect(encounterHistoryRecords[2].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[2].encounterType).toEqual(encounterType2);

      expect(encounterHistoryRecords[3].locationId).toEqual(location2.id);
      expect(encounterHistoryRecords[3].departmentId).toEqual(department1.id);
      expect(encounterHistoryRecords[3].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[3].encounterType).toEqual(encounterType3);

      expect(encounterHistoryRecords[4].locationId).toEqual(location3.id);
      expect(encounterHistoryRecords[4].departmentId).toEqual(department1.id);
      expect(encounterHistoryRecords[4].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[4].encounterType).toEqual(encounterType3);

      expect(encounterHistoryRecords[5].locationId).toEqual(location3.id);
      expect(encounterHistoryRecords[5].departmentId).toEqual(department2.id);
      expect(encounterHistoryRecords[5].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[5].encounterType).toEqual(encounterType3);

      expect(encounterHistoryRecords[6].locationId).toEqual(location3.id);
      expect(encounterHistoryRecords[6].departmentId).toEqual(department3.id);
      expect(encounterHistoryRecords[6].examinerId).toEqual(clinician1.id);
      expect(encounterHistoryRecords[6].encounterType).toEqual(encounterType3);

      expect(encounterHistoryRecords[7].locationId).toEqual(location3.id);
      expect(encounterHistoryRecords[7].departmentId).toEqual(department3.id);
      expect(encounterHistoryRecords[7].examinerId).toEqual(clinician2.id);
      expect(encounterHistoryRecords[7].encounterType).toEqual(encounterType3);

      expect(encounterHistoryRecords[8].locationId).toEqual(location3.id);
      expect(encounterHistoryRecords[8].departmentId).toEqual(department3.id);
      expect(encounterHistoryRecords[8].examinerId).toEqual(clinician2.id);
      expect(encounterHistoryRecords[8].encounterType).toEqual(encounterType4);
    });
  });
});
