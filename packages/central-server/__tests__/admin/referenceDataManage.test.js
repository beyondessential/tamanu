import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import {
  REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  SYSTEM_DATA_TYPES,
  VISIBILITY_STATUSES,
  MANAGEABLE_REFERENCE_DATA_TYPES,
  PSEUDO_REFERENCE_TYPES,
} from '@tamanu/constants';
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

    it('should offer the constant values for columns stored as plain strings', async () => {
      const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: TEST_TYPE });
      expect(response).toHaveSucceeded();

      const route = response.body.find(c => c.key === 'route');
      expect(route.enumValues).toContain('oral');
      expect(route.enumValues).not.toContain('telepathic');
      expect(route.enumName).toBe('DRUG_ROUTE_LABELS');
    });

    it('should include the detail model columns for a type that has one', async () => {
      const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: TEST_TYPE });
      expect(response).toHaveSucceeded();

      const isSensitive = response.body.find(c => c.key === 'isSensitive');
      expect(isSensitive).toMatchObject({ detail: true, type: 'BOOLEAN' });
      expect(response.body.map(c => c.key)).not.toContain('referenceDataId');
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
      const response = await noPermissionApp
        .get(COLUMNS_URL)
        .query({ referenceDataType: TEST_TYPE });
      expect(response).toBeForbidden();
    });

    it('should resolve all FK columns to a suggester endpoint for every manageable type', async () => {
      const failures = [];
      for (const type of MANAGEABLE_REFERENCE_DATA_TYPES) {
        const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: type });
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

    it('should add a read-only name companion column for FK columns whose target has a name', async () => {
      let sawCompanion = false;
      for (const type of MANAGEABLE_REFERENCE_DATA_TYPES) {
        const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: type });
        if (response.status >= 400) continue;
        const cols = response.body;
        for (const col of cols.filter(c => c.isFkName)) {
          sawCompanion = true;
          // display/search only — never written through the create/edit form
          expect(col).toMatchObject({ type: 'STRING', readOnly: true, isFkName: true });
          expect(typeof col.fkKey).toBe('string');
          // it sits alongside a real FK id column that carries the suggester
          const fkCol = cols.find(c => c.key === col.fkKey);
          expect(fkCol?.suggesterEndpoint).toBeTruthy();
        }
      }
      expect(sawCompanion).toBe(true);
    });

    it('should reject import-only “reference” types that have no model', async () => {
      const response = await adminApp.get(COLUMNS_URL).query({
        referenceDataType: PSEUDO_REFERENCE_TYPES.INVOICE_PRICE_LIST_CHARGING,
      });
      expect(response).toHaveRequestError();
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

    it('should create a drug with its detail record from one payload', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'test-drug-detail-code',
        name: 'Test Drug Detail',
        route: 'oral',
        isSensitive: true,
      });
      expect(response).toHaveSucceeded();

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(referenceDrug).toMatchObject({ route: 'oral', isSensitive: true });
    });

    it('should create a detail record even when no detail fields were filled in', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'test-drug-bare-code',
        name: 'Test Drug Bare',
      });
      expect(response).toHaveSucceeded();

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(referenceDrug).toBeTruthy();
      expect(referenceDrug.isSensitive).toBe(false);
    });

    it('should not create a detail record for a type that has none', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.VILLAGE,
        code: 'test-village-code',
        name: 'Test Village',
      });
      expect(response).toHaveSucceeded();

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(referenceDrug).toBe(null);
    });

    it('should reject a detail value outside its constant', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'test-drug-bad-route-code',
        name: 'Test Drug Bad Route',
        route: 'telepathic',
      });
      expect(response).toHaveRequestError();
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

    it('should reject creating the same ReferenceDataRelation again when an active row already exists', async () => {
      const parent = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
      });
      const child = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
      });

      const payload = {
        referenceDataType: SYSTEM_DATA_TYPES.REFERENCE_DATA_RELATION,
        type: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
        referenceDataParentId: parent.id,
        referenceDataId: [child.id],
      };

      const first = await adminApp.post(BASE_URL).send(payload);
      expect(first).toHaveSucceeded();
      expect(Array.isArray(first.body)).toBe(true);
      expect(first.body).toHaveLength(1);

      const second = await adminApp.post(BASE_URL).send(payload);
      expect(second).toHaveRequestError();

      const count = await models.ReferenceDataRelation.count({
        where: {
          referenceDataParentId: parent.id,
          referenceDataId: child.id,
          type: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
        },
      });
      expect(count).toBe(1);
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

    it('should update a drug detail field', async () => {
      const created = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'test-drug-edit-code',
        name: 'Test Drug Edit',
        route: 'oral',
      });
      expect(created).toHaveSucceeded();

      const response = await adminApp.put(`${BASE_URL}/${created.body.id}`).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        name: 'Test Drug Edited',
        route: 'topical',
      });
      expect(response).toHaveSucceeded();

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: created.body.id },
      });
      expect(referenceDrug.route).toBe('topical');
    });

    it('should create a missing detail record when editing an orphaned drug', async () => {
      const orphan = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.DRUG,
        code: 'test-drug-orphan-code',
      });

      const response = await adminApp.put(`${BASE_URL}/${orphan.id}`).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        route: 'oral',
      });
      expect(response).toHaveSucceeded();

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: orphan.id },
      });
      expect(referenceDrug.route).toBe('oral');
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

    it('should merge detail fields into each row', async () => {
      const drug = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
        code: 'search-detail',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
      await models.ReferenceDrug.create({
        ...fake(models.ReferenceDrug),
        referenceDataId: drug.id,
        route: 'topical',
        isSensitive: true,
      });

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        code: 'search-detail',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.data.find(r => r.id === drug.id)).toMatchObject({
        route: 'topical',
        isSensitive: true,
      });
    });

    it('should return null detail fields for a record with no detail row', async () => {
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        code: 'search-alpha',
      });
      expect(response).toHaveSucceeded();
      expect(response.body.data[0]).toMatchObject({ route: null, isSensitive: null });
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
