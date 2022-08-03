import { format } from 'date-fns';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';

describe('FHIR integration - Immunization', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('success', () => {
    it('fetches an immunization', async () => {
      const administeredVaccine = {};
      const path = `/v1/integration/fhir/Immunization?_sort=-issued&_page=0&_count=2&status=final`;
      const response = await app.get(path);
      expect(response).toHaveSucceeded();
      /*
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'immunizations',
        meta: {
          lastUpdated: administeredVaccine.updatedAt.toISOString(),
        },
        type: 'searchset',
        total: 1,
        link: [
          {
            relation: 'self',
            url: expect.stringContaining(path),
          },
        ],
        entry: [
          {},
        ],
      });
      */
    });

    it("returns no error but no results when patient reference doesn't match", async () => {
      const id = 'placeholder';
      const path = `/v1/integration/fhir/Immunization?_sort=-issued&_page=0&_count=2&patient=${id}`;
      const response = await app.get(path);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'immunizations',
        meta: {
          lastUpdated: null,
        },
        type: 'searchset',
        total: 0,
        link: [
          {
            relation: 'self',
            url: expect.stringContaining(path),
          },
        ],
        entry: [],
      });
    });

    it("returns no error but no results when vaccine code doesn't match", async () => {
      const id = 'placeholder';
      const path = `/v1/integration/fhir/Immunization?_sort=-issued&_page=0&_count=2&vaccine-code=${id}`;
      const response = await app.get(path);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'immunizations',
        meta: {
          lastUpdated: null,
        },
        type: 'searchset',
        total: 0,
        link: [
          {
            relation: 'self',
            url: expect.stringContaining(path),
          },
        ],
        entry: [],
      });
    });

    it('returns a list of immunizations when passed no query params', async () => {
      const response = await app.get('/v1/integration/fhir/Immunization');
      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(0);
    });
  });

  describe('failure', () => {
    it('returns a 422 error when passed the wrong query params', async () => {
      const path = '/v1/integration/fhir/Immunization?_sort=id&_page=z&_count=x&status=initial';
      const response = await app.get(path);
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        error: {
          errors: [
            '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
            '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
            '_sort must be one of the following values: -issued, issued',
          ],
        },
      });
    });
  });
});
