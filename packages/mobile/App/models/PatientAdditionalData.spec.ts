import { mocked } from 'jest-mock';

import { Database } from '~/infra/db';
import { fakePatient } from '/root/tests/helpers/fake';
import { readConfig } from '~/services/config';
jest.mock('~/services/config');
const mockedReadConfig = mocked(readConfig);
jest.setTimeout(60000); // can be slow to create/delete records

const FACILITY_ID = 'facility-pad-spec';

beforeAll(async () => {
  mockedReadConfig.mockReturnValue(Promise.resolve(FACILITY_ID));
  await Database.connect();
  await Database.models.Facility.createAndSaveOne({
    id: FACILITY_ID,
    code: FACILITY_ID,
    name: 'PAD spec facility',
  });
});

describe('PatientAdditionalData', () => {
  describe('setUpdatedAtByField', () => {
    it('records per-field sync ticks for fields populated on insert', async () => {
      const patient = fakePatient();
      await Database.models.Patient.insert(patient);

      await Database.models.PatientAdditionalData.createAndSaveOne({
        patient: patient.id,
        placeOfBirth: 'Suva',
        primaryContactNumber: '1234567',
      });

      const saved = await Database.models.PatientAdditionalData.getForPatient(patient.id);
      const updatedAtByField = JSON.parse(saved.updatedAtByField ?? 'null');
      expect(updatedAtByField).toMatchObject({
        place_of_birth: expect.any(Number),
        primary_contact_number: expect.any(Number),
      });
    });

    it('records insert field ticks in the same form as update field ticks', async () => {
      const patient = fakePatient();
      await Database.models.Patient.insert(patient);

      const created = await Database.models.PatientAdditionalData.createAndSaveOne({
        patient: patient.id,
        placeOfBirth: 'Nadi',
      });
      await Database.models.PatientAdditionalData.updateValues(created.id, {
        primaryContactNumber: '7654321',
      });

      const saved = await Database.models.PatientAdditionalData.getForPatient(patient.id);
      const updatedAtByField = JSON.parse(saved.updatedAtByField ?? 'null');
      expect(updatedAtByField).toMatchObject({
        place_of_birth: expect.any(Number),
        primary_contact_number: expect.any(Number),
      });
    });
  });
});
