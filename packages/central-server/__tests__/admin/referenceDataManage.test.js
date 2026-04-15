import { fake } from '@tamanu/fake-data/fake';
import { REFERENCE_TYPES, VISIBILITY_STATUSES, MANAGEABLE_REFERENCE_DATA_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

const BASE_URL = '/api/admin/referenceData/manage';
const COLUMNS_URL = `${BASE_URL}/columns`;
const TEST_TYPE = REFERENCE_TYPES.DRUG;

describe('Reference Data Manage', () => {
  let ctx;
  let models;
  let adminApp;
  let baseApp;
  /** Authenticated user with no DB permissions (central test config uses DB-backed permissions). */
  let noPermissionApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
    noPermissionApp = await baseApp.asRole('practitioner');
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('GET /columns', () => {
    it('should return columns for a valid type', async () => {
      const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: TEST_TYPE });
      expect(response).toHaveSucceeded();
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      const keys = response.body.map(c => c.key);
      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys).toContain('code');
      expect(keys).toContain('visibilityStatus');

      const nameCol = response.body.find(c => c.key === 'name');
      expect(nameCol).toMatchObject({ type: 'TEXT', readOnly: false });
    });

    it('should reject an invalid type', async () => {
      const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: 'invalidType' });
      expect(response).toHaveRequestError();
    });

    it('should reject a missing type', async () => {
      const response = await adminApp.get(COLUMNS_URL);
      expect(response).toHaveRequestError();
    });

    it('should forbid access without permission', async () => {
      const response = await noPermissionApp.get(COLUMNS_URL).query({ referenceDataType: TEST_TYPE });
      expect(response).toBeForbidden();
    });

    it('should resolve all FK columns to a suggester endpoint for every manageable type', async () => {
      const failures = [];
      for (const type of MANAGEABLE_REFERENCE_DATA_TYPES) {
        const response = await adminApp.get(COLUMNS_URL).query({ type });
        if (response.status >= 400) continue;
        for (const col of response.body) {
          if (col.readOnlyOnEdit && !col.suggesterEndpoint && col.key.endsWith('Id')) {
            failures.push(
              `${type}.${col.key}: FK column has no suggester endpoint. ` +
              'Either the suggester endpoint is missing in packages/constants/src/suggesters.ts, ' +
              "or the association alias doesn't match the endpoint name and needs an override in " +
              'packages/central-server/app/admin/referenceDataManageUtils.js (FK_ENDPOINT_OVERRIDES).',
            );
          }
        }
      }
      expect(failures).toEqual([]);
    });
  });

  describe('POST /', () => {
    it('should create a new reference data record', async () => {
      const data = {
        referenceDataType: TEST_TYPE,
        code: 'test-create-code',
        name: 'Test Create Drug',
      };
      const response = await adminApp.post(BASE_URL).send(data);
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        code: 'test-create-code',
        name: 'Test Create Drug',
        type: TEST_TYPE,
      });

      const record = await models.ReferenceData.findByPk(response.body.id);
      expect(record).toBeTruthy();
      expect(record.name).toBe('Test Create Drug');
    });

    it('should reject creating a record with a duplicate unique field', async () => {
      const existing = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
        code: 'duplicate-code',
      });

      const response = await adminApp.post(BASE_URL).send({
        id: existing.id,
        referenceDataType: TEST_TYPE,
        code: existing.code,
        name: 'Another Drug',
      });
      expect(response).toHaveRequestError();
    });

    it('should reject an invalid type', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: 'invalidType',
        name: 'Should Fail',
      });
      expect(response).toHaveRequestError();
    });

    it('should forbid access without permission', async () => {
      const response = await noPermissionApp.post(BASE_URL).send({
        referenceDataType: TEST_TYPE,
        name: 'Should Fail',
      });
      expect(response).toBeForbidden();
    });
  });

  describe('PUT /:id', () => {
    it('should update an existing record', async () => {
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
      });

      const response = await adminApp.put(`${BASE_URL}/${record.id}`).send({
        referenceDataType: TEST_TYPE,
        name: 'Updated Name',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.name).toBe('Updated Name');

      await record.reload();
      expect(record.name).toBe('Updated Name');
    });

    it('should return an error for a non-existent record', async () => {
      const response = await adminApp.put(`${BASE_URL}/non-existent-id`).send({
        referenceDataType: TEST_TYPE,
        name: 'Should Fail',
      });
      expect(response).toHaveRequestError();
    });

    it('should not update read-only fields', async () => {
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
      });
      const originalId = record.id;

      const response = await adminApp.put(`${BASE_URL}/${record.id}`).send({
        referenceDataType: TEST_TYPE,
        id: 'hacked-id',
        name: 'Valid Update',
      });
      expect(response).toHaveSucceeded();

      await record.reload();
      expect(record.id).toBe(originalId);
      expect(record.name).toBe('Valid Update');
    });

    it('should forbid access without permission', async () => {
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
      });

      const response = await noPermissionApp.put(`${BASE_URL}/${record.id}`).send({
        referenceDataType: TEST_TYPE,
        name: 'Should Fail',
      });
      expect(response).toBeForbidden();
    });
  });

  describe('GET /', () => {
    beforeAll(async () => {
      // Create test records with known data
      await Promise.all([
        models.ReferenceData.create({
          ...fake(models.ReferenceData),
          type: TEST_TYPE,
          name: 'Alpha Drug',
          code: 'search-alpha',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        }),
        models.ReferenceData.create({
          ...fake(models.ReferenceData),
          type: TEST_TYPE,
          name: 'Beta Drug',
          code: 'search-beta',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        }),
        models.ReferenceData.create({
          ...fake(models.ReferenceData),
          type: TEST_TYPE,
          name: 'Historical Drug',
          code: 'search-historical',
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      ]);
    });

    it('should list records for a valid type', async () => {
      const response = await adminApp.get(BASE_URL).query({ referenceDataType: TEST_TYPE });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        page: 0,
        rowsPerPage: 2,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should filter by text fields using iLike', async () => {
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        name: 'Alpha',
      });
      expect(response).toHaveSucceeded();
      const names = response.body.data.map(r => r.name);
      expect(names).toContain('Alpha Drug');
      expect(names).not.toContain('Beta Drug');
    });

    it('should filter by visibilityStatus with exact match', async () => {
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
      expect(response).toHaveSucceeded();
      const statuses = response.body.data.map(r => r.visibilityStatus);
      expect(statuses).not.toContain(VISIBILITY_STATUSES.HISTORICAL);
    });

    it('should return historical records when visibilityStatus filter includes historical', async () => {
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        code: 'search-historical',
        visibilityStatus: `${VISIBILITY_STATUSES.CURRENT},${VISIBILITY_STATUSES.HISTORICAL}`,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.some(r => r.code === 'search-historical')).toBe(true);
    });

    it('should support sorting', async () => {
      const ascResponse = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        orderBy: 'name',
        order: 'ASC',
        code: 'search-',
      });
      expect(ascResponse).toHaveSucceeded();
      const ascNames = ascResponse.body.data.map(r => r.name);

      const descResponse = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        orderBy: 'name',
        order: 'DESC',
        code: 'search-',
      });
      expect(descResponse).toHaveSucceeded();
      const descNames = descResponse.body.data.map(r => r.name);

      expect(ascNames).toEqual([...descNames].reverse());
    });

    it('should reject an invalid order value', async () => {
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        order: 'INVALID',
      });
      expect(response).toHaveRequestError();
    });

    it('should reject an invalid type', async () => {
      const response = await adminApp.get(BASE_URL).query({ referenceDataType: 'invalidType' });
      expect(response).toHaveRequestError();
    });

    it('should forbid access without permission', async () => {
      const response = await noPermissionApp.get(BASE_URL).query({ referenceDataType: TEST_TYPE });
      expect(response).toBeForbidden();
    });
  });
});
