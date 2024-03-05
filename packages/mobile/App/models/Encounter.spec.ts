import { Database } from '~/infra/db';
import { fakeEncounter, fakePatient, fakeUser } from '/root/tests/helpers/fake';

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
      delete encounter.examiner;
      expect(result[0]).toMatchObject(encounter);
    });
  });
});
