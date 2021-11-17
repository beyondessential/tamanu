import { format } from 'date-fns';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';

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
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const id = encodeURIComponent(patient.displayId);
      const path = `/v1/integration/fijiVps/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=VRS%7C${id}`;

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
            address: [], // TODO
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
            ],
            name: [
              {
                family: patient.lastName,
                given: [patient.firstName, patient.middleName],
                prefix: [], // TODO
                use: 'official',
              },
              {
                text: patient.culturalName,
                use: 'nickname',
              },
            ],
            resourceType: 'Patient',
            telecom: [], // TODO
          },
        ],
      });
    });
  });

  describe('failure', () => {
    it.todo('returns an error when passed the wrong query params');
  });
});
