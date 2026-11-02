import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import {
  ADMINISTRATION_FREQUENCIES,
  DRUG_ROUTE_VALUES,
  DRUG_UNIT_VALUES,
  REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  SYSTEM_DATA_TYPES,
  VISIBILITY_STATUSES,
  LAB_TEST_TYPE_VISIBILITY_STATUSES,
  OTHER_REFERENCE_TYPES,
  MANAGEABLE_REFERENCE_DATA_TYPES,
  PSEUDO_REFERENCE_TYPES,
  TASK_FREQUENCY_UNIT,
} from '@tamanu/constants';
import { HIDDEN_COLUMNS } from '../../app/admin/referenceDataManageUtils';
import { createTestContext } from '../utilities';

const BASE_URL = '/api/admin/referenceData/manage';
const COLUMNS_URL = `${BASE_URL}/columns`;
const TEST_TYPE = REFERENCE_TYPES.DRUG;

// A satellite table holds the rest of one reference type's record, keyed by reference_data_id:
// ReferenceDrug for a drug, TaskTemplate for a task template. Manage derives its columns from the
// base model, so it has to follow the association out to the satellite — otherwise those columns
// are invisible in the panel even though the importer and exporter both handle them.
const SATELLITE_MODEL_BY_TYPE = {
  [REFERENCE_TYPES.DRUG]: 'ReferenceDrug',
  [REFERENCE_TYPES.TASK_TEMPLATE]: 'TaskTemplate',
  [REFERENCE_TYPES.MEDICATION_TEMPLATE]: 'ReferenceMedicationTemplate',
};

// Satellite columns deliberately left out of Manage, as "type.column". Empty: every satellite
// column is currently surfaced, and a new one has to be surfaced or listed here with its reason.
const EXCLUDED_SATELLITE_COLUMNS = new Set();

// Columns Manage hides for every model (timestamps, the sync tick), read from the source so that
// hiding a new internal column doesn't fail this test as though a product field had gone missing.
// The satellite's own identity is spelled out rather than read from DETAIL_INTERNAL_COLUMNS: if a
// real column were ever added to that set, this test has to keep checking it rather than quietly
// stop.
const INTERNAL_SATELLITE_COLUMNS = new Set([
  ...Object.entries(HIDDEN_COLUMNS)
    .filter(([, hiddenForEveryModel]) => hiddenForEveryModel === true)
    .map(([key]) => key),
  'id',
  'referenceDataId',
]);

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

    it('should surface every satellite column of every manageable type', async () => {
      // Discovered from the schema rather than from Manage's own registry, so a satellite table
      // that nobody wired up fails here instead of going unnoticed. A hasOne keyed by anything
      // other than referenceDataId is a separate record with its own row in Manage (a reference
      // area's imaging external code, a village's catchment facility), not a satellite.
      const satelliteModelNames = Object.values(models.ReferenceData.associations)
        .filter(assoc => assoc.associationType === 'HasOne' && assoc.foreignKey === 'referenceDataId')
        .map(assoc => assoc.target.name);
      expect(satelliteModelNames.toSorted()).toEqual(
        Object.values(SATELLITE_MODEL_BY_TYPE).toSorted(),
      );

      const failures = [];
      for (const [type, modelName] of Object.entries(SATELLITE_MODEL_BY_TYPE)) {
        const response = await adminApp.get(COLUMNS_URL).query({ referenceDataType: type });
        if (response.status >= 400) {
          // collected rather than thrown, so one broken type doesn't hide the others
          failures.push(`${type}: /columns answered ${response.status}, so nothing could be checked.`);
          continue;
        }

        // the read-only name companion an FK gets is dropped for a detail column: nothing
        // populates it, so it would offer a filter the list query then ignores
        const syntheticDetailColumns = response.body.filter(c => c.detail && c.isFkName);
        if (syntheticDetailColumns.length > 0) {
          failures.push(
            `${type}: ${syntheticDetailColumns.map(c => c.key).join(', ')} reached the column ` +
              'list as a synthetic detail column. getColumnsForModel is meant to drop those.',
          );
        }

        // A detail column sharing a key with a base one would render its own search field while
        // the list query filtered the base column instead, so a collision has to fail loudly
        // rather than quietly misdirect the filter.
        const keys = response.body.map(c => c.key);
        const collidingKeys = [...new Set(keys.filter((key, i) => keys.indexOf(key) !== i))];
        if (collidingKeys.length > 0) {
          failures.push(
            `${type}: ${collidingKeys.join(', ')} is both a base and a detail column. The list ` +
              'query would filter the base one and silently ignore the detail one.',
          );
        }

        const shownKeys = new Set(keys);

        for (const key of Object.keys(models[modelName].rawAttributes)) {
          if (INTERNAL_SATELLITE_COLUMNS.has(key)) continue;
          if (EXCLUDED_SATELLITE_COLUMNS.has(`${type}.${key}`)) continue;
          if (shownKeys.has(key)) continue;
          failures.push(
            `${type}.${key}: ${modelName}.${key} is never shown in the Manage table. ` +
              'Register the satellite in DETAIL_ASSOCIATIONS (packages/central-server/app/admin/' +
              'referenceDataManageUtils.js) so its columns are surfaced, or add it to ' +
              'EXCLUDED_SATELLITE_COLUMNS in this file with the reason it cannot be.',
          );
        }
      }
      expect(failures).toEqual([]);
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

    it('should fall back to the column default when a defaulted field is submitted blank', async () => {
      // A cleared field reaches us as '', which numeric columns reject outright and text columns
      // would silently store over their default.
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'test-drug-blank-default-code',
        name: 'Test Drug Blank Default',
        unitConversion: '',
      });
      expect(response).toHaveSucceeded();

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(Number(referenceDrug.unitConversion)).toBe(1);
    });

    it('should keep a blank value for a column with no default', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.DRUG,
        code: 'test-drug-blank-nodefault-code',
        name: 'Test Drug Blank No Default',
        notes: '',
      });
      expect(response).toHaveSucceeded();

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(referenceDrug.notes).toBe('');
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

    it('should reject a code with characters the importer would reject', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: TEST_TYPE,
        code: 'test_bad_code',
        name: 'Test Bad Code',
      });
      expect(response).toHaveRequestError();

      const record = await models.ReferenceData.findOne({ where: { code: 'test_bad_code' } });
      expect(record).toBe(null);
    });

    it('should reject an id with characters the importer would reject', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: TEST_TYPE,
        id: 'test_bad_id',
        code: 'test-ok-code',
        name: 'Test Bad Id',
      });
      expect(response).toHaveRequestError();

      const record = await models.ReferenceData.findByPk('test_bad_id');
      expect(record).toBe(null);
    });

    it('should reject a blank code', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: TEST_TYPE,
        code: '',
        name: 'Test Blank Code',
      });
      expect(response).toHaveRequestError();
    });

    it('should create a medication template with its detail record', async () => {
      const drug = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.DRUG,
      });
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.MEDICATION_TEMPLATE,
        code: 'test-medication-template-code',
        name: 'Test Medication Template',
        medicationId: drug.id,
        route: DRUG_ROUTE_VALUES[0],
        dosingUnit: DRUG_UNIT_VALUES[0],
        frequency: Object.values(ADMINISTRATION_FREQUENCIES)[0],
      });
      expect(response).toHaveSucceeded();

      const template = await models.ReferenceMedicationTemplate.findOne({
        where: { referenceDataId: response.body.id },
      });
      expect(template).toMatchObject({ medicationId: drug.id, route: DRUG_ROUTE_VALUES[0] });
    });

    it('should reject a medication template missing its required detail fields', async () => {
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: REFERENCE_TYPES.MEDICATION_TEMPLATE,
        code: 'test-medication-template-bare-code',
        name: 'Test Medication Template Bare',
      });
      expect(response).toHaveRequestError();

      const record = await models.ReferenceData.findOne({
        where: { code: 'test-medication-template-bare-code' },
      });
      expect(record).toBe(null);
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

    it('should reject updating a code to invalid characters', async () => {
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
        code: 'test-edit-valid-code',
      });

      const response = await adminApp.put(`${BASE_URL}/${record.id}`).send({
        referenceDataType: TEST_TYPE,
        code: 'test_edit_bad_code',
      });
      expect(response).toHaveRequestError();

      await record.reload();
      expect(record.code).toBe('test-edit-valid-code');
    });

    it('allows editing a record whose existing code breaks the character rule, if unchanged', async () => {
      // A type imported without a code character rule (e.g. lab test panel) can hold a legacy code
      // with an underscore; editing another field must not be blocked by re-sending it unchanged.
      const record = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
        code: 'legacy_code',
      });

      const response = await adminApp.put(`${BASE_URL}/${record.id}`).send({
        referenceDataType: TEST_TYPE,
        code: 'legacy_code',
        name: 'Updated Name',
      });
      expect(response).toHaveSucceeded();

      await record.reload();
      expect(record.name).toBe('Updated Name');
    });

    it('should let a NOT NULL text column with a default be cleared', async () => {
      // lab_test_types.unit is NOT NULL DEFAULT '', and plenty of qualitative tests have no unit,
      // so clearing it has to keep saving.
      const category = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      });
      const labTestType = await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: category.id,
        unit: 'mmol/L',
      });

      const response = await adminApp.put(`${BASE_URL}/${labTestType.id}`).send({
        referenceDataType: OTHER_REFERENCE_TYPES.LAB_TEST_TYPE,
        unit: '',
      });
      expect(response).toHaveSucceeded();

      await labTestType.reload();
      expect(labTestType.unit).toBe('');
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

  // spec: specs/sync/sensitive-networks.md
  describe('facility sensitive network', () => {
    const createNetwork = () => models.SensitiveNetwork.create(fake(models.SensitiveNetwork));
    const editFacility = (id, body) =>
      adminApp
        .put(`${BASE_URL}/${id}`)
        .send({ referenceDataType: OTHER_REFERENCE_TYPES.FACILITY, ...body });

    it('refuses to move a facility to another network', async () => {
      const network = await createNetwork();
      const other = await createNetwork();
      const facility = await models.Facility.create(
        fake(models.Facility, { sensitiveNetworkId: network.id }),
      );

      const response = await editFacility(facility.id, { sensitiveNetworkId: other.id });
      expect(response).toHaveRequestError();
      expect(response.body.error.message).toContain('cannot change sensitive network');

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBe(network.id);
    });

    it('refuses to enrol a facility that belongs to no network', async () => {
      const network = await createNetwork();
      const facility = await models.Facility.create(fake(models.Facility));

      const response = await editFacility(facility.id, { sensitiveNetworkId: network.id });
      expect(response).toHaveRequestError();

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBeNull();
    });

    it('refuses to remove a facility from its network', async () => {
      const network = await createNetwork();
      const facility = await models.Facility.create(
        fake(models.Facility, { sensitiveNetworkId: network.id }),
      );

      const response = await editFacility(facility.id, { sensitiveNetworkId: null });
      expect(response).toHaveRequestError();

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBe(network.id);
    });

    it('saves other fields when the network is sent unchanged', async () => {
      const network = await createNetwork();
      const facility = await models.Facility.create(
        fake(models.Facility, { sensitiveNetworkId: network.id }),
      );

      const name = `${facility.name} edited`;

      const response = await editFacility(facility.id, { name, sensitiveNetworkId: network.id });
      expect(response).toHaveSucceeded();

      await facility.reload();
      expect(facility.name).toBe(name);
      expect(facility.sensitiveNetworkId).toBe(network.id);
    });

    it('creates a facility in a network', async () => {
      const network = await createNetwork();
      const { code, name } = fake(models.Facility);

      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: OTHER_REFERENCE_TYPES.FACILITY,
        code,
        name,
        sensitiveNetworkId: network.id,
      });
      expect(response).toHaveSucceeded();

      const created = await models.Facility.findByPk(response.body.id);
      expect(created.sensitiveNetworkId).toBe(network.id);
    });
  });

  // Types with their own table are guarded by their own permission noun here, exactly as they are
  // on import and export — generic ReferenceData rights must not reach them.
  describe('permissions per data type', () => {
    const SENSITIVE_NETWORK = OTHER_REFERENCE_TYPES.SENSITIVE_NETWORK;
    const referenceDataGrants = [
      ['list', 'ReferenceData'],
      ['create', 'ReferenceData'],
      ['write', 'ReferenceData'],
    ];

    let referenceDataOnlyApp;
    let sensitiveNetworkApp;

    beforeAll(async () => {
      referenceDataOnlyApp = await baseApp.asNewRole(referenceDataGrants);
      sensitiveNetworkApp = await baseApp.asNewRole([
        ...referenceDataGrants,
        ['list', 'SensitiveNetwork'],
        ['create', 'SensitiveNetwork'],
        ['write', 'SensitiveNetwork'],
      ]);
    });

    const createNetworkAs = app => {
      const { code, name } = fake(models.SensitiveNetwork);
      return app.post(BASE_URL).send({ referenceDataType: SENSITIVE_NETWORK, code, name });
    };

    const renameNetworkAs = async app => {
      const network = await models.SensitiveNetwork.create(fake(models.SensitiveNetwork));
      const newName = `${network.name} renamed`;
      const response = await app
        .put(`${BASE_URL}/${network.id}`)
        .send({ referenceDataType: SENSITIVE_NETWORK, name: newName });
      await network.reload();
      return { response, newName, storedName: network.name };
    };

    it('forbids creating a sensitive network with only reference data permissions', async () => {
      expect(await createNetworkAs(referenceDataOnlyApp)).toBeForbidden();
    });

    it('forbids renaming a sensitive network with only reference data permissions', async () => {
      const { response, newName, storedName } = await renameNetworkAs(referenceDataOnlyApp);
      expect(response).toBeForbidden();
      expect(storedName).not.toBe(newName);
    });

    it('forbids listing sensitive networks with only reference data permissions', async () => {
      const response = await referenceDataOnlyApp
        .get(BASE_URL)
        .query({ referenceDataType: SENSITIVE_NETWORK });
      expect(response).toBeForbidden();
    });

    it('allows managing sensitive networks with the SensitiveNetwork permission', async () => {
      expect(await createNetworkAs(sensitiveNetworkApp)).toHaveSucceeded();

      const { response, newName, storedName } = await renameNetworkAs(sensitiveNetworkApp);
      expect(response).toHaveSucceeded();
      expect(storedName).toBe(newName);

      const list = await sensitiveNetworkApp
        .get(BASE_URL)
        .query({ referenceDataType: SENSITIVE_NETWORK });
      expect(list).toHaveSucceeded();
    });

    it('still manages ordinary reference data with only reference data permissions', async () => {
      const created = await referenceDataOnlyApp.post(BASE_URL).send({
        referenceDataType: TEST_TYPE,
        code: 'refdata-permission-scope-code',
        name: 'Reference Data Permission Scope',
      });
      expect(created).toHaveSucceeded();

      const renamed = await referenceDataOnlyApp.put(`${BASE_URL}/${created.body.id}`).send({
        referenceDataType: TEST_TYPE,
        name: 'Reference Data Permission Scope Renamed',
      });
      expect(renamed).toHaveSucceeded();

      const list = await referenceDataOnlyApp.get(BASE_URL).query({ referenceDataType: TEST_TYPE });
      expect(list).toHaveSucceeded();
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

    // Satellite columns are shown in the table, so the search bar filters on them too. They sit on
    // the joined table rather than on reference_data, so they go through the association path.
    const createDrugWithDetail = async (code, detail) => {
      const drug = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
        code,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
      await models.ReferenceDrug.create({ referenceDataId: drug.id, ...detail });
      return drug;
    };

    it('should filter by a satellite text column', async () => {
      const matching = await createDrugWithDetail('filter-notes-match', {
        notes: 'Refrigerate below 8 degrees',
      });
      const other = await createDrugWithDetail('filter-notes-other', {
        notes: 'Store at room temperature',
      });

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        notes: 'refrigerate',
        rowsPerPage: 100,
      });
      expect(response).toHaveSucceeded();
      const ids = response.body.data.map(r => r.id);
      expect(ids).toContain(matching.id);
      expect(ids).not.toContain(other.id);
    });

    it('should filter by a satellite enum column with an exact match', async () => {
      const matching = await createDrugWithDetail('filter-route-match', {
        route: 'intravitreal',
      });
      const other = await createDrugWithDetail('filter-route-other', { route: 'oral' });

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        route: 'intravitreal',
        rowsPerPage: 100,
      });
      expect(response).toHaveSucceeded();
      const ids = response.body.data.map(r => r.id);
      expect(ids).toContain(matching.id);
      expect(ids).not.toContain(other.id);
    });

    it('should count only the records a satellite filter matches', async () => {
      const sensitive = await createDrugWithDetail('filter-sensitive-match', {
        isSensitive: true,
      });
      const other = await createDrugWithDetail('filter-sensitive-other', { isSensitive: false });

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        isSensitive: 'true',
        rowsPerPage: 100,
      });
      expect(response).toHaveSucceeded();
      const ids = response.body.data.map(r => r.id);
      expect(ids).toContain(sensitive.id);
      expect(ids).not.toContain(other.id);
      // the count query has to carry the same join, or the table pages against the wrong total
      expect(response.body.count).toBe(response.body.data.length);
    });

    it('should filter a satellite boolean by an explicit false', async () => {
      // the search bar sends 'false' as a string, so an explicit No stays distinct from no filter
      const sensitive = await createDrugWithDetail('filter-bool-true', { isSensitive: true });
      const notSensitive = await createDrugWithDetail('filter-bool-false', { isSensitive: false });

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        code: 'filter-bool',
        isSensitive: 'false',
        rowsPerPage: 100,
      });
      expect(response).toHaveSucceeded();
      const ids = response.body.data.map(r => r.id);
      expect(ids).toContain(notSensitive.id);
      expect(ids).not.toContain(sensitive.id);
    });

    it('should drop records with no satellite row from a satellite filter', async () => {
      const withDetail = await createDrugWithDetail('filter-rowless-with', {
        notes: 'Dispense whole',
      });
      const withoutDetail = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: TEST_TYPE,
        code: 'filter-rowless-without',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const filtered = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        notes: 'dispense whole',
        rowsPerPage: 100,
      });
      expect(filtered).toHaveSucceeded();
      const filteredIds = filtered.body.data.map(r => r.id);
      expect(filteredIds).toContain(withDetail.id);
      expect(filteredIds).not.toContain(withoutDetail.id);

      // the join only turns inner for the length of a detail filter, so it's still listed otherwise
      const unfiltered = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        code: 'filter-rowless-without',
      });
      expect(unfiltered).toHaveSucceeded();
      expect(unfiltered.body.data.map(r => r.id)).toContain(withoutDetail.id);
    });

    it('should AND a base filter with a satellite filter', async () => {
      const both = await createDrugWithDetail('filter-combined-both', { notes: 'Shake well' });
      const baseOnly = await createDrugWithDetail('filter-combined-base', {
        notes: 'Do not refrigerate',
      });

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        code: 'filter-combined', // matches both
        notes: 'shake well', // matches only the first
        rowsPerPage: 100,
      });
      expect(response).toHaveSucceeded();
      const ids = response.body.data.map(r => r.id);
      expect(ids).toContain(both.id);
      expect(ids).not.toContain(baseOnly.id);
      // both halves of the filter have to reach the count query, not just the base one
      expect(response.body.count).toBe(response.body.data.length);
    });

    it('should filter a second satellite through its own join', async () => {
      const createTaskTemplate = async (code, frequencyUnit) => {
        const record = await models.ReferenceData.create({
          ...fake(models.ReferenceData),
          type: REFERENCE_TYPES.TASK_TEMPLATE,
          code,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        });
        await models.TaskTemplate.create({
          ...fake(models.TaskTemplate),
          referenceDataId: record.id,
          frequencyValue: 1,
          frequencyUnit,
        });
        return record;
      };
      const hourly = await createTaskTemplate('filter-task-hourly', TASK_FREQUENCY_UNIT.HOUR);
      const daily = await createTaskTemplate('filter-task-daily', TASK_FREQUENCY_UNIT.DAY);

      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: REFERENCE_TYPES.TASK_TEMPLATE,
        frequencyUnit: TASK_FREQUENCY_UNIT.HOUR,
        rowsPerPage: 100,
      });
      expect(response).toHaveSucceeded();
      const ids = response.body.data.map(r => r.id);
      expect(ids).toContain(hourly.id);
      expect(ids).not.toContain(daily.id);
    });

    it('should ignore a filter on a column the type does not have', async () => {
      const response = await adminApp.get(BASE_URL).query({
        referenceDataType: TEST_TYPE,
        frequencyUnit: 'hour', // a task template's satellite column, not a drug's
        rowsPerPage: 100,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.data.length).toBeGreaterThan(0);
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

    it('lists panelOnly lab test types by default so they can be managed', async () => {
      const category = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      });
      const panelOnlyType = await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: category.id,
        visibilityStatus: LAB_TEST_TYPE_VISIBILITY_STATUSES.PANEL_ONLY,
      });

      const response = await adminApp
        .get(BASE_URL)
        .query({ referenceDataType: OTHER_REFERENCE_TYPES.LAB_TEST_TYPE });

      expect(response).toHaveSucceeded();
      expect(response.body.data.some(record => record.id === panelOnlyType.id)).toBe(true);
    });

    it('lists reflexTest lab test types by default so they can be managed', async () => {
      const category = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      });
      const reflexTestType = await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: category.id,
        visibilityStatus: LAB_TEST_TYPE_VISIBILITY_STATUSES.REFLEX_TEST,
      });

      const response = await adminApp
        .get(BASE_URL)
        .query({ referenceDataType: OTHER_REFERENCE_TYPES.LAB_TEST_TYPE });

      expect(response).toHaveSucceeded();
      expect(response.body.data.some(record => record.id === reflexTestType.id)).toBe(true);
    });

    it('should forbid access without permission', async () => {
      const response = await noPermissionApp.get(BASE_URL).query({ referenceDataType: TEST_TYPE });
      expect(response).toBeForbidden();
    });
  });

  describe('default specimen type (relation-backed column)', () => {
    const LAB_TEST_CATEGORY = REFERENCE_TYPES.LAB_TEST_CATEGORY;

    const createSpecimenType = () =>
      models.ReferenceData.create({ ...fake(models.ReferenceData), type: REFERENCE_TYPES.SPECIMEN_TYPE });

    const createCategory = () =>
      models.ReferenceData.create({ ...fake(models.ReferenceData), type: LAB_TEST_CATEGORY });

    const getDefault = categoryId =>
      models.ReferenceDataRelation.findOne({
        where: {
          referenceDataParentId: categoryId,
          type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
        },
      });

    it('exposes a writable id column and a read-only name column for lab test category', async () => {
      const response = await adminApp
        .get(COLUMNS_URL)
        .query({ referenceDataType: LAB_TEST_CATEGORY });
      expect(response).toHaveSucceeded();

      const idCol = response.body.find(c => c.key === 'defaultSpecimenTypeId');
      const nameCol = response.body.find(c => c.key === 'defaultSpecimenType');
      expect(idCol).toMatchObject({ suggesterEndpoint: 'specimenType', readOnly: false });
      expect(nameCol).toMatchObject({ readOnly: true });
    });

    it('creates the relation when a category is created with a default specimen type', async () => {
      const specimenType = await createSpecimenType();
      const response = await adminApp.post(BASE_URL).send({
        referenceDataType: LAB_TEST_CATEGORY,
        code: 'cat-with-default',
        name: 'Category with default',
        defaultSpecimenTypeId: specimenType.id,
      });
      expect(response).toHaveSucceeded();

      const relation = await getDefault(response.body.id);
      expect(relation?.referenceDataId).toBe(specimenType.id);
    });

    it('sets, replaces and clears the default on edit (at most one)', async () => {
      const category = await createCategory();
      const first = await createSpecimenType();
      const second = await createSpecimenType();

      // set
      await adminApp
        .put(`${BASE_URL}/${category.id}`)
        .send({ referenceDataType: LAB_TEST_CATEGORY, defaultSpecimenTypeId: first.id });
      expect((await getDefault(category.id))?.referenceDataId).toBe(first.id);

      // replace — still exactly one
      await adminApp
        .put(`${BASE_URL}/${category.id}`)
        .send({ referenceDataType: LAB_TEST_CATEGORY, defaultSpecimenTypeId: second.id });
      expect((await getDefault(category.id))?.referenceDataId).toBe(second.id);
      const count = await models.ReferenceDataRelation.count({
        where: {
          referenceDataParentId: category.id,
          type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
        },
      });
      expect(count).toBe(1);

      // clear
      await adminApp
        .put(`${BASE_URL}/${category.id}`)
        .send({ referenceDataType: LAB_TEST_CATEGORY, defaultSpecimenTypeId: '' });
      expect(await getDefault(category.id)).toBeNull();
    });

    it('leaves the default untouched when a partial edit omits the field', async () => {
      const specimenType = await createSpecimenType();
      const category = await createCategory();
      await models.ReferenceDataRelation.create({
        referenceDataParentId: category.id,
        referenceDataId: specimenType.id,
        type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
      });

      // A PUT that changes another field but omits defaultSpecimenTypeId must not clear it.
      await adminApp
        .put(`${BASE_URL}/${category.id}`)
        .send({ referenceDataType: LAB_TEST_CATEGORY, name: 'Renamed category' });

      expect((await getDefault(category.id))?.referenceDataId).toBe(specimenType.id);
    });

    it('returns the default specimen type id and name in the list', async () => {
      const specimenType = await createSpecimenType();
      const category = await createCategory();
      await models.ReferenceDataRelation.create({
        referenceDataParentId: category.id,
        referenceDataId: specimenType.id,
        type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
      });

      const response = await adminApp
        .get(BASE_URL)
        .query({ referenceDataType: LAB_TEST_CATEGORY, code: category.code });
      expect(response).toHaveSucceeded();
      const row = response.body.data.find(r => r.id === category.id);
      expect(row).toMatchObject({
        defaultSpecimenTypeId: specimenType.id,
        defaultSpecimenType: specimenType.name,
      });
    });
  });
});
