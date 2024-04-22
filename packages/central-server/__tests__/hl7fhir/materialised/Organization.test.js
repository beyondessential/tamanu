import { fake } from '@tamanu/shared/test-helpers';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { createTestContext } from '../../utilities';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - Organization`, () => {
  let ctx;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  async function makeOrganization(overrides = {}) {
    const { Facility, FhirOrganization } = ctx.store.models;
    const facility = await Facility.create(fake(Facility, overrides));
    const mat = await FhirOrganization.materialiseFromUpstream(facility.id);
    return [facility, mat];
  }

  describe('materialise', () => {
    it('should materialise a facility as Organization', async () => {
      const [facility, mat] = await makeOrganization();
      // act
      const path = `/api/integration/${INTEGRATION_ROUTE}/Organization/${mat.id}`;
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Organization',
        id: expect.any(String),
        meta: {
          lastUpdated: expect.any(String),
        },
        identifier: [
          {
            value: facility.code,
          }
        ],
        name: facility.name,
        active: true,
      });
      expect(response).toHaveSucceeded();
    });

    it('should handle inactive correctly', async () => {
      const [, mat] = await makeOrganization({
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });
      // act
      const path = `/api/integration/${INTEGRATION_ROUTE}/Organization/${mat.id}`;
      const response = await app.get(path);

      // assert
      expect(response.body.active).toBe(false);
      expect(response).toHaveSucceeded();
    });
  });
  describe('errors', () => {
    it('returns not found when fetching a non-existent organization', async () => {
      // arrange
      const id = fakeUUID();
      const path = `/api/integration/${INTEGRATION_ROUTE}/Organization/${id}`;

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
              text: `no Organization with id ${id}`,
            },
          },
        ],
      });
      expect(response.status).toBe(404);
    });

    it('returns an error if there are any unknown search params', async () => {
      // arrange
      const path = `/api/integration/${INTEGRATION_ROUTE}/Organization?whatever=something`;

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
