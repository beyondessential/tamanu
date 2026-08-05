import { fake } from '@tamanu/fake-data/fake';
import {
  REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  SYSTEM_DATA_TYPES,
  VISIBILITY_STATUSES,
  MANAGEABLE_REFERENCE_DATA_TYPES,
  PSEUDO_REFERENCE_TYPES,
} from '@tamanu/constants';
import {
  SATELLITE_ASSOCIATIONS,
  getSatelliteColumnKeys,
} from '../../app/admin/referenceDataManageUtils';
import { createTestContext } from '../utilities';

// Satellite columns that are NOT yet surfaced in the Manage table, listed individually (per
// type + column) rather than as a blanket type-level skip. This is deliberate: a NEWLY added
// satellite column on one of these types is not on the list, so the guardrail below will fail
// until it is either surfaced in Manage or explicitly added here. Wiring these two satellites
// up to Manage (with the provisioning/importer parity that entails) is tracked in TAM-7046
// (https://linear.app/bes/issue/TAM-7046).
const MANAGE_TABLE_EXCLUDED_SATELLITE_COLUMNS = new Set([
  // taskTemplate -> TaskTemplate (task_templates); known follow-up, TAM-7046.
  'taskTemplate.frequencyValue',
  'taskTemplate.frequencyUnit',
  'taskTemplate.highPriority',
  // medicationTemplate -> ReferenceMedicationTemplate; known follow-up, TAM-7046.
  'medicationTemplate.medicationId',
  'medicationTemplate.isOngoing',
  'medicationTemplate.isPrn',
  'medicationTemplate.isVariableDose',
  'medicationTemplate.doseAmount',
  'medicationTemplate.dosingUnit',
  'medicationTemplate.frequency',
  'medicationTemplate.route',
  'medicationTemplate.durationValue',
  'medicationTemplate.durationUnit',
  'medicationTemplate.notes',
  'medicationTemplate.dischargeQuantity',
]);

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

    // A reference type whose columns are split across a 1:1 "satellite" table (a hasOne on
    // ReferenceData keyed by referenceDataId, e.g. reference_drugs) resolves to the base
    // ReferenceData model, so the satellite's columns only reach the Manage table when joined
    // explicitly. This guardrail asserts that every satellite column of every satellite-backed
    // manageable type is EITHER surfaced by the /columns endpoint OR explicitly allowlisted as a
    // known follow-up — mirroring validateFullReferenceDataImport's allowlist-and-throw style and
    // the selfReferencingFkDeferrability test's "enumerate everything, else fail" shape. It would
    // have caught dosingUnit/dispensingUnit/unitConversion being added to reference_drugs without
    // being wired into Manage.
    it('surfaces every satellite column in the Manage columns, or lists it on the exclusion allowlist', async () => {
      // Structurally discover satellite associations from the model layer: a hasOne on
      // ReferenceData keyed by referenceDataId. The registry that drives the Manage join must
      // cover exactly these, so a NEW satellite type cannot be added without being registered.
      const discoveredAliases = Object.values(models.ReferenceData.associations)
        .filter(
          assoc => assoc.associationType === 'HasOne' && assoc.foreignKey === 'referenceDataId',
        )
        .map(assoc => assoc.as)
        .sort();
      expect(discoveredAliases).toEqual(Object.values(SATELLITE_ASSOCIATIONS).sort());

      const missing = [];
      for (const [type, alias] of Object.entries(SATELLITE_ASSOCIATIONS)) {
        expect(MANAGEABLE_REFERENCE_DATA_TYPES).toContain(type);

        const satelliteModel = models.ReferenceData.associations[alias].target;
        const satelliteColumnKeys = getSatelliteColumnKeys(satelliteModel);
        expect(satelliteColumnKeys.length).toBeGreaterThan(0);

        const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: type });
        expect(response).toHaveSucceeded();
        const surfacedKeys = new Set(response.body.map(col => col.key));

        for (const columnKey of satelliteColumnKeys) {
          const isSurfaced = surfacedKeys.has(columnKey);
          const isAllowlisted = MANAGE_TABLE_EXCLUDED_SATELLITE_COLUMNS.has(`${type}.${columnKey}`);
          if (!isSurfaced && !isAllowlisted) {
            missing.push(`${type}.${columnKey}`);
          }
        }
      }

      if (missing.length > 0) {
        throw new Error(
          `Satellite reference-data columns are neither surfaced in the Manage table nor allowlisted:\n` +
            `${missing.map(key => `  ${key}`).join('\n')}\n\n` +
            `Either surface them (join the satellite in packages/central-server/app/admin/` +
            `referenceDataManageUtils.js via MANAGE_ENABLED_SATELLITE_TYPES + SATELLITE_ASSOCIATIONS), ` +
            `or, if intentionally deferred, add each to MANAGE_TABLE_EXCLUDED_SATELLITE_COLUMNS in this ` +
            `test with a note referencing the follow-up card.`,
        );
      }
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

  // End-to-end coverage for the drug satellite (ReferenceDrug / reference_drugs): its columns must
  // display in /columns, save on create, upsert on update, list as flat row values, and be filterable
  // — the parity the Manage table was missing for satellite-backed reference data (TAM-7046).
  describe('drug satellite (ReferenceDrug) columns', () => {
    const SATELLITE_KEYS = [
      'route',
      'dosingUnit',
      'dispensingUnit',
      'unitConversion',
      'notes',
      'isSensitive',
    ];

    it('surfaces the ReferenceDrug satellite columns in GET /columns for drug', async () => {
      const response = await adminApp
        .get(COLUMNS_URL)
        .query({ referenceDataType: REFERENCE_TYPES.DRUG });
      expect(response).toHaveSucceeded();

      const byKey = new Map(response.body.map(col => [col.key, col]));
      for (const key of SATELLITE_KEYS) {
        expect(byKey.get(key)).toMatchObject({ key, isSatellite: true, readOnly: false });
      }
      // typed so the web renders the right field/table cell (number input, Yes/No)
      expect(byKey.get('unitConversion').type).toBe('DECIMAL');
      expect(byKey.get('isSensitive').type).toBe('BOOLEAN');
    });

    it('persists satellite fields to reference_drugs on create', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'sat-create-code',
        name: 'Satellite Create Drug',
        route: 'oral',
        dosingUnit: 'mg',
        dispensingUnit: 'tablet',
        unitConversion: 2,
        notes: 'take with food',
        isSensitive: true,
      });
      expect(response).toHaveSucceeded();

      const satellite = await models.ReferenceDrug.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(satellite).toBeTruthy();
      expect(satellite).toMatchObject({
        route: 'oral',
        dosingUnit: 'mg',
        dispensingUnit: 'tablet',
        notes: 'take with food',
        isSensitive: true,
      });
      expect(Number(satellite.unitConversion)).toBe(2);
    });

    it('upserts the satellite row on update without creating duplicates', async () => {
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.DRUG,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // first update creates the satellite row (none existed yet)
      const first = await adminApp.put(`${BASE_URL}/${record.id}`).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        name: 'Updated Satellite Drug',
        route: 'iv',
        dosingUnit: 'mL',
        isSensitive: true,
      });
      expect(first).toHaveSucceeded();

      const satellite = await models.ReferenceDrug.findOne({
        where: { referenceDataId: record.id },
      });
      expect(satellite).toMatchObject({ route: 'iv', dosingUnit: 'mL', isSensitive: true });

      // second update mutates the same satellite row rather than inserting another
      const second = await adminApp.put(`${BASE_URL}/${record.id}`).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        route: 'oral',
      });
      expect(second).toHaveSucceeded();

      const count = await models.ReferenceDrug.count({ where: { referenceDataId: record.id } });
      expect(count).toBe(1);
      await satellite.reload();
      expect(satellite.route).toBe('oral');
      // upsert merges: fields set by the earlier update are preserved when the later update omits
      // them, rather than being reset to their column defaults
      expect(satellite.dosingUnit).toBe('mL');
      expect(satellite.isSensitive).toBe(true);
    });

    it('flattens satellite values onto the listed row and can filter on them', async () => {
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.DRUG,
        code: 'sat-list-code',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
      await models.ReferenceDrug.create({
        referenceDataId: record.id,
        route: 'sublingual-unique',
        dosingUnit: 'mcg',
        isSensitive: true,
      });

      // satellite column search resolves via the joined association ($alias.column$)
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: REFERENCE_TYPES.DRUG,
        route: 'sublingual-unique',
      });
      expect(response).toHaveSucceeded();

      const row = response.body.data.find(r => r.id === record.id);
      expect(row).toBeTruthy();
      expect(row).toMatchObject({ route: 'sublingual-unique', dosingUnit: 'mcg', isSensitive: true });
      // the nested association object is flattened away, not returned raw
      expect(row).not.toHaveProperty('referenceDrug');
      expect(response.body.data.every(r => r.route === 'sublingual-unique')).toBe(true);
      // count must reflect the satellite-column filter too (the count query only joins the
      // satellite when a filter references it — see countInclude), not the unfiltered total
      expect(response.body.count).toBe(1);
    });

    it('lists a drug with no satellite row, returning satellite columns as null', async () => {
      // A pre-existing drug may have no reference_drugs row; the satellite is left-joined, so it
      // must still list with its satellite columns null rather than erroring or being dropped.
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.DRUG,
        code: 'sat-none-code',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'sat-none-code',
      });
      expect(response).toHaveSucceeded();

      const row = response.body.data.find(r => r.id === record.id);
      expect(row).toBeTruthy();
      for (const key of SATELLITE_KEYS) {
        expect(row[key]).toBeNull();
      }
      expect(row).not.toHaveProperty('referenceDrug');
    });

    it('does not create a satellite row when no satellite fields are provided on create', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'sat-empty-create-code',
        name: 'No Satellite Drug',
      });
      expect(response).toHaveSucceeded();

      const satellite = await models.ReferenceDrug.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(satellite).toBeNull();
    });
  });
});
