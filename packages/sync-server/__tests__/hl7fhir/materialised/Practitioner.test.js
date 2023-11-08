import { fake } from '@tamanu/shared/test-helpers';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - Practitioner`, () => {
  let ctx;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  async function makePractitioner(overrides = {}) {
    const { User, FhirPractitioner } = ctx.store.models;
    const user = await User.create(fake(User, overrides));
    const mat = await FhirPractitioner.materialiseFromUpstream(user.id);
    return [user, mat];
  }

  describe('materialise', () => {
    it('should materialise a user as practitioner', async () => {
      const [user, mat] = await makePractitioner();

      // act
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Practitioner/${mat.id}`;
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Practitioner',
        id: expect.any(String),
        meta: {
          lastUpdated: expect.any(String),
        },
        identifier: [
          {
            use: 'secondary',
            value: user.id,
          },
          {
            use: 'usual',
            value: user.displayId,
          },
        ],
        name: [
          {
            text: user.displayName,
          },
        ],
        telecom: [
          {
            system: 'email',
            value: user.email,
          },
        ],
      });
      expect(response).toHaveSucceeded();
    });
  });

  describe('search', () => {
    const practitioners = [];
    const testEmail = 'testEmailForFilteringByTelecom@something.com';
    beforeAll(async () => {
      const { FhirPractitioner } = ctx.store.models;
      await FhirPractitioner.destroy({ where: {} });

      practitioners.push(await makePractitioner({ email: testEmail }));
      practitioners.push(await makePractitioner());
      practitioners.push(await makePractitioner());
      practitioners.push(await makePractitioner());
      practitioners.push(await makePractitioner());
      practitioners.push(await makePractitioner());
    });

    it('should return a list when passed no query params', async () => {
      const response = await app.get(`/v1/integration/${INTEGRATION_ROUTE}/Practitioner`);

      expect(response.body.total).toBe(6);
      expect(response.body.entry).toHaveLength(6);
      expect(response).toHaveSucceeded();
    });

    describe('sorts', () => {
      it('should sort by lastUpdated ascending', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Practitioner?_sort=_lastUpdated`,
        );

        expect(response.body.total).toBe(6);
        expect(response.body.entry.map(entry => entry.resource.id)).toEqual(
          practitioners.map(([, mat]) => mat.id),
        );
        expect(response).toHaveSucceeded();
      });

      it('should sort by lastUpdated descending', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Practitioner?_sort=-_lastUpdated`,
        );

        expect(response.body.total).toBe(6);
        expect(response.body.entry.map(entry => entry.resource.id)).toEqual(
          practitioners.map(([, mat]) => mat.id).reverse(),
        );
        expect(response).toHaveSucceeded();
      });
    });

    describe('filters', () => {
      it('should filter by identifier', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Practitioner?identifier=${practitioners[0][0].id}`,
        );

        expect(response.body.total).toBe(1);
        expect(response.body.entry.map(ent => ent.resource.id)).toStrictEqual(
          [practitioners[0]].map(([, mat]) => mat.id),
        );
        expect(response).toHaveSucceeded();
      });

      it('should filter by email (telecom)', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Practitioner?telecom=${testEmail}`,
        );

        expect(response.body.total).toBe(1);
        expect(response.body.entry.map(ent => ent.resource.id)).toStrictEqual(
          [practitioners[0]].map(([, mat]) => mat.id),
        );
        expect(response).toHaveSucceeded();
      });
    });
  });

  describe('errors', () => {
    it('returns not found when fetching a non-existent practitioner', async () => {
      // arrange
      const id = fakeUUID();
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Practitioner/${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: expect.any(String),
            details: {
              text: `no Practitioner with id ${id}`,
            },
          },
        ],
      });
      expect(response.status).toBe(404);
    });

    it('returns an error if there are any unknown search params', async () => {
      // arrange
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Practitioner?whatever=something`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-supported',
            diagnostics: expect.any(String),
            details: {
              text: 'parameter is not supported: whatever',
            },
          },
        ],
      });
      expect(response).toHaveRequestError(501);
    });
  });
});
