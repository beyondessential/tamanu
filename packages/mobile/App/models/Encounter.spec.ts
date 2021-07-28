import { Database } from '~/infra/db';
import { fakePatient, fakeEncounter, fakeUser, fake, createWithRelations } from '/root/tests/helpers/fake';

beforeAll(async () => {
  await Database.connect();
});

describe('Encounter', () => {
  describe('getForPatient', () => {
    it('gets a patient', async () => {
      const patient = fakePatient();
      await Database.models.Patient.insert(patient);

      const user = fakeUser();
      await Database.models.User.insert(user);

      const encounter = fakeEncounter();
      encounter.patient = patient;
      encounter.examiner = user;
      await Database.models.Encounter.insert(encounter);

      const result = await Database.models.Encounter.getForPatient(patient.id);
      const { examiner, ...expectedResult } = encounter; // examiner is not eager-loaded from db
      expect(result[0]).toMatchObject(expectedResult);
    });
  });

  describe('findMarkedForUpload', () => {
    it('finds marked encounters for a patient channel', async () => {
      // arrange
      const { Encounter } = Database.models;

      const encounter = await fake(Encounter, {
        relations: ['patient', 'examiner'],
      });
      await createWithRelations(Encounter, encounter);

      // act
      const results = await Encounter.findMarkedForUpload({ channel: `patient/${encounter.patient.id}/encounter` });

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('id', encounter.id);
    });

    it('finds marked encounters for a scheduledVaccine channel', async () => {
      // arrange
      const { Encounter } = Database.models;

      const encounter = await fake(Encounter, {
        relations: ['patient', 'examiner', 'administeredVaccines', 'administeredVaccines.scheduledVaccine'],
      });
      await createWithRelations(Encounter, encounter);

      const scheduledVaccine = encounter.administeredVaccines[0].scheduledVaccine;
      const channel = `scheduledVaccine/${scheduledVaccine.id}/encounter`;

      // act
      const results = await Encounter.findMarkedForUpload({ channel });

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('id', encounter.id);
    });
  });
});
