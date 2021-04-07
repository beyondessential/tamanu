import { Database } from '~/infra/db';
import { fakePatient, fakeEncounter } from '/root/tests/helpers/fake';

beforeAll(async () => {
  await Database.connect();
});

describe('Encounter', () => {
  describe('getForPatient', () => {
    it('gets a patient', async () => {
      const patient = fakePatient();
      await Database.models.Patient.insert(patient);

      const encounter = fakeEncounter();
      encounter.patient = patient;
      await Database.models.Encounter.insert(encounter);

      const result = await Database.models.Encounter.getForPatient(patient.id);
      expect(result[0]).toMatchObject(encounter);
    });
  });
});
