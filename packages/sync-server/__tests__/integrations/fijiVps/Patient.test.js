import { format } from 'date-fns';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/integrations/fiji-vps/schema';

describe('VPS integration - Patient', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('success', () => {
    it('fetches a patient', async () => {
      // arrange
      const { Patient, PatientAdditionalData } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const additionalData = await PatientAdditionalData.create({
        ...fake(PatientAdditionalData),
        patientId: patient.id,
      });
      await patient.reload(); // saving PatientAdditionalData updates the patient too
      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'patients',
        meta: {
          lastUpdated: patient.updatedAt.toISOString(),
        },
        type: 'searchset',
        total: 1,
        link: [
          {
            relation: 'self',
            link: expect.stringContaining(path),
          },
        ],
        entry: [
          {
            active: true,
            address: [
              {
                city: additionalData.cityTown,
                line: [additionalData.streetVillage],
                type: 'physical',
                use: 'home',
              },
            ],
            birthDate: format(patient.dateOfBirth, 'yyyy-MM-dd'),
            gender: patient.sex,
            identifier: [
              {
                use: 'usual',
                value: patient.id,
              },
              {
                assigner: 'Tamanu',
                system: 'http://tamanu.io/data-dictionary/application-reference-number.html',
                use: 'official',
                value: patient.displayId,
              },
              {
                assigner: 'RTA',
                use: 'secondary',
                value: additionalData.drivingLicense,
              },
            ],
            name: [
              {
                family: patient.lastName,
                given: [patient.firstName, patient.middleName],
                prefix: [additionalData.title],
                use: 'official',
              },
              {
                text: patient.culturalName,
                use: 'nickname',
              },
            ],
            resourceType: 'Patient',
            telecom: [
              {
                rank: 1,
                value: additionalData.primaryContactNumber,
              },
              {
                rank: 2,
                value: additionalData.secondaryContactNumber,
              },
            ],
          },
        ],
      });
    });
  });

  describe('failure', () => {
    it('returns an error when passed the wrong query params', async () => {
      // arrange
      const { Patient, PatientAdditionalData } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      await PatientAdditionalData.create({
        ...fake(PatientAdditionalData),
        patientId: patient.id,
      });
      const id = encodeURIComponent(`not-the-right-identifier|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/Patient?_sort=id&_page=z&_count=x&status=initial&subject%3Aidentifier=${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        error: {
          errors: [
            'subject:identifier must be in the format "<namespace>|<id>"',
            'status must be one of the following values: final',
            '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
            '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
            '_sort must be one of the following values: -issued',
          ],
        },
      });
    });
  });
});
