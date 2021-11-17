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
      const path = `/v1/integration/fijiVps/Patient?subject%3Aidentifier=${id}&_count=2&_page=0&_sort=-issued&status=final`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'patients',
        meta: {
          lastUpdated: expect.any(Date),
        },
        type: 'searchset',
        total: 1,
        link: [
          {
            relation: 'self',
            link: expect.stringContaining(path),
          },
        ],
        entry: [{}], // TODO
      });
    });
  });

  describe('failure', () => {
    it.todo('returns a hl7 fhir comliant error when passed the wrong query params');
  });
});
