import { formatISO9075, subDays } from 'date-fns';

// getTotalEncountersAndResponses filters by the current device's id, so this test
// stubs it to a fixed, synchronous value it can assert against.
jest.mock('react-native-device-info', () => ({
  ...jest.requireActual('react-native-device-info/jest/react-native-device-info-mock'),
  getUniqueId: () => 'own-device-id',
}));

import { Database } from '~/infra/db';
import { fakeEncounter, fakePatient, fakeSurvey, fakeUser } from '/root/tests/helpers/fake';
import { Certainty, ReferenceDataType } from '~/types';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

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

      const facility = await Database.models.Facility.createAndSaveOne({
        id: 'facility-central',
        code: 'central',
        name: 'Central Hospital',
      });
      const location = await Database.models.Location.createAndSaveOne({
        id: 'location-ward-a',
        code: 'ward-a',
        name: 'Ward A',
        facility,
      });

      const encounter = fakeEncounter();
      encounter.patient = patient;
      encounter.examiner = user;
      encounter.location = location;
      await Database.models.Encounter.insert(encounter);

      const result = await Database.models.Encounter.getForPatient(patient.id);
      // getForPatient joins only what the visits history renders, not examiner or patient
      delete encounter.examiner;
      delete encounter.patient;
      delete encounter.location;
      expect(result[0]).toMatchObject(encounter);
      expect(result[0].location).toMatchObject({
        id: location.id,
        name: 'Ward A',
        facility: { id: facility.id, name: 'Central Hospital' },
      });
      expect(result[0].notes).toEqual([]);
    });

    it('attaches each encounter’s diagnoses, with their reference data', async () => {
      const patient = fakePatient();
      await Database.models.Patient.insert(patient);
      const user = fakeUser();
      await Database.models.User.insert(user);

      const diagnosedEncounter = fakeEncounter();
      diagnosedEncounter.patient = patient;
      diagnosedEncounter.examiner = user;
      const undiagnosedEncounter = fakeEncounter();
      undiagnosedEncounter.startDate = formatISO9075(subDays(new Date(), 1));
      undiagnosedEncounter.patient = patient;
      undiagnosedEncounter.examiner = user;
      await Database.models.Encounter.insert([diagnosedEncounter, undiagnosedEncounter]);

      const malaria = await Database.models.ReferenceData.createAndSaveOne({
        id: 'diagnosis-malaria',
        type: ReferenceDataType.Diagnosis,
        code: 'B54',
        name: 'Malaria',
      });
      await Database.models.Diagnosis.createAndSaveOne({
        date: getCurrentDateTimeString(),
        certainty: Certainty.Confirmed,
        diagnosis: malaria,
        encounter: diagnosedEncounter,
        clinician: user,
      });

      const [first, second] = await Database.models.Encounter.getForPatient(patient.id);
      expect(first.id).toBe(diagnosedEncounter.id);
      expect(first.diagnoses).toHaveLength(1);
      expect(first.diagnoses[0]).toMatchObject({
        certainty: Certainty.Confirmed,
        diagnosis: { id: malaria.id, name: 'Malaria' },
      });
      expect(second.id).toBe(undiagnosedEncounter.id);
      expect(second.diagnoses).toEqual([]);
    });
  });

  describe('diagnoses relation', () => {
    it('is not loaded eagerly', async () => {
      const patient = fakePatient();
      await Database.models.Patient.insert(patient);
      const user = fakeUser();
      await Database.models.User.insert(user);
      const encounter = fakeEncounter();
      encounter.patient = patient;
      encounter.examiner = user;
      await Database.models.Encounter.insert(encounter);

      const loaded = await Database.models.Encounter.findOne({ where: { id: encounter.id } });
      expect(loaded.diagnoses).toBeUndefined();
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

  describe('getTotalEncountersAndResponses', () => {
    it('only counts encounters from the current device', async () => {
      const ownDeviceId = 'own-device-id';

      const user = fakeUser();
      await Database.models.User.insert(user);

      const ownDevicePatient = fakePatient();
      await Database.models.Patient.insert(ownDevicePatient);

      const ownDeviceEncounter = fakeEncounter();
      ownDeviceEncounter.deviceId = ownDeviceId;
      ownDeviceEncounter.patient = ownDevicePatient;
      ownDeviceEncounter.examiner = user;
      await Database.models.Encounter.insert(ownDeviceEncounter);

      const otherDevicePatient = fakePatient();
      await Database.models.Patient.insert(otherDevicePatient);

      const otherDeviceEncounter = fakeEncounter();
      otherDeviceEncounter.deviceId = 'some-other-device';
      otherDeviceEncounter.patient = otherDevicePatient;
      otherDeviceEncounter.examiner = user;
      await Database.models.Encounter.insert(otherDeviceEncounter);

      const survey = fakeSurvey();
      const result = await Database.models.Encounter.getTotalEncountersAndResponses(survey.id);

      const totalEncounters = result.reduce((sum, row) => sum + Number(row.totalEncounters), 0);
      expect(totalEncounters).toBe(1);
    });
  });
});
