import { formatISO9075, subDays } from 'date-fns';

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
      delete encounter.examiner; // examiner is not eager-loaded from db
      expect(result[0]).toMatchObject(encounter);
    });
  });

  describe('getCurrentEncounterForPatient', () => {
    it('returns an encounter started today and ignores one from a previous day', async () => {
      const patient = fakePatient();
      await Database.models.Patient.insert(patient);

      const user = fakeUser();
      await Database.models.User.insert(user);

      const oldEncounter = fakeEncounter();
      oldEncounter.startDate = formatISO9075(subDays(new Date(), 5));
      oldEncounter.patient = patient;
      oldEncounter.examiner = user;
      await Database.models.Encounter.insert(oldEncounter);

      const todayEncounter = fakeEncounter();
      todayEncounter.startDate = formatISO9075(new Date());
      todayEncounter.patient = patient;
      todayEncounter.examiner = user;
      await Database.models.Encounter.insert(todayEncounter);

      const result = await Database.models.Encounter.getCurrentEncounterForPatient(patient.id);
      expect(result?.id).toBe(todayEncounter.id);
    });
  });
});
