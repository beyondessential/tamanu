import { v4 as uuidv4 } from 'uuid';
import { fake, fakePatient, fakeUser } from 'shared/test-helpers';
import { initDb } from '../initDb';
import { sleepAsync } from 'shared/utils/sleepAsync';
import { add } from 'date-fns';

describe('AdministeredVaccine.lastVaccinationForPatient', () => {
  let models;
  let context;
  const patientId = uuidv4();
  const encounterId = uuidv4();

  beforeAll(async () => {
    context = await initDb({ testMode: true });
    models = context.models;
    const { Patient, Encounter, Department, Location, User, Facility } = models;

    const examiner = await User.create(fakeUser());
    await Patient.create({ ...fakePatient(), id: patientId });
    const fact = await Facility.create({ ...fake(Facility) });
    const dept = await Department.create({ ...fake(Department), facilityId: fact.id });
    const loc = await Location.create({ ...fake(Location), facilityId: fact.id });

    await Encounter.create({
      ...fake(Encounter),
      id: encounterId,
      patientId,
      encounterType: 'clinic',
      examinerId: examiner.id,
      departmentId: dept.id,
      locationId: loc.id,
    });
  });
  
  afterEach(async () => {
    await models.AdministeredVaccine.truncate();
  });

  describe('when used without selector', () => {
    it('should return latest vax', async () => {
      // Arrange
      const { AdministeredVaccine, ScheduledVaccine } = models;
      const scheduledVaccineId = uuidv4();
      const now = new Date;
      
      await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        id: scheduledVaccineId,
      });

      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'first',
        status: 'GIVEN',
        date: add(now, { minutes: 1 }),
        scheduledVaccineId,
        encounterId,
      });


      const vax = await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'last',
        status: 'GIVEN',
        date: add(now, { minutes: 2 }),
        scheduledVaccineId,
        encounterId,
      });

      // Act
      const result = await AdministeredVaccine.lastVaccinationForPatient(patientId);
      
      // Assert
      expect(result).toBeTruthy();
      expect(result.id).toEqual(vax.id);
    });
    
    it('should return nothing if there are no vax', async () => {
      // Arrange
      const { AdministeredVaccine, ScheduledVaccine } = models;
      const scheduledVaccineId = uuidv4();
      const now = new Date();

      await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        id: scheduledVaccineId,
      });

      // Act
      const result = await AdministeredVaccine.lastVaccinationForPatient(patientId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('when used for COVID vax selection', () => {
    it('should return latest COVID19 vax when present', async () => {
      // Arrange
      const { AdministeredVaccine, ScheduledVaccine } = models;
      const scheduledVaccineId = uuidv4();
      const covidScheduledVaccineId = uuidv4();
      const now = new Date();

      await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        id: scheduledVaccineId,
      });

      await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        id: covidScheduledVaccineId,
        label: 'COVID-19 AZ',
      });

      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'first',
        status: 'GIVEN',
        date: add(now, { minutes: 1 }),
        scheduledVaccineId,
        encounterId,
      });

      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'first-covid',
        status: 'GIVEN',
        date: add(now, { minutes: 2 }),
        scheduledVaccineId: covidScheduledVaccineId,
        encounterId,
      });

      const vax = await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'last-covid',
        status: 'GIVEN',
        date: add(now, { minutes: 3 }),
        scheduledVaccineId: covidScheduledVaccineId,
        encounterId,
      });
      
      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'last',
        status: 'GIVEN',
        date: add(now, { minutes: 4 }),
        scheduledVaccineId,
        encounterId,
      });

      // Act
      const result = await AdministeredVaccine.lastVaccinationForPatient(patientId, ['COVID-19 AZ']);

      // Assert
      expect(result).toBeTruthy();
      expect(result.id).toEqual(vax.id);
    });
    
    it('should return nothing when no COVID19 vax are present', async () => {
      // Arrange
      const { AdministeredVaccine, ScheduledVaccine } = models;
      const scheduledVaccineId = uuidv4();
      const now = new Date();

      await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        id: scheduledVaccineId,
      });

      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'first',
        status: 'GIVEN',
        date: add(now, { minutes: 1 }),
        scheduledVaccineId,
        encounterId,
      });

      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'last',
        status: 'GIVEN',
        date: add(now, { minutes: 2 }),
        scheduledVaccineId,
        encounterId,
      });

      // Act
      const result = await AdministeredVaccine.lastVaccinationForPatient(patientId, ['COVID-19 AZ']);

      // Assert
      expect(result).toBeNull();
    });
    
    it('should return nothing when only COVAX is present', async () => {
      // Arrange
      const { AdministeredVaccine, ScheduledVaccine } = models;
      const scheduledVaccineId = uuidv4();
      const now = new Date();

      await ScheduledVaccine.create({
        ...fake(ScheduledVaccine),
        id: scheduledVaccineId,
        label: 'COVAX',
      });

      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'first',
        status: 'GIVEN',
        date: add(now, { minutes: 1 }),
        scheduledVaccineId,
        encounterId,
      });

      await AdministeredVaccine.create({
        ...fake(AdministeredVaccine),
        id: 'last',
        status: 'GIVEN',
        date: add(now, { minutes: 2 }),
        scheduledVaccineId,
        encounterId,
      });

      // Act
      const result = await AdministeredVaccine.lastVaccinationForPatient(patientId, [
        'COVID-19 AZ',
      ]);

      // Assert
      expect(result).toBeNull();
    });
  });
});
