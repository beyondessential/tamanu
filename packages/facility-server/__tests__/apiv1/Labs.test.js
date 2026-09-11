import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from 'vitest';
import config from 'config';

import {
  INVOICE_STATUSES,
  LAB_REQUEST_STATUSES,
  LAB_TEST_TYPE_VISIBILITY_STATUSES,
  REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import {
  createDummyEncounter,
  createDummyPatient,
  randomLabRequest,
} from '@tamanu/database/demoData';
import { chance, fake } from '@tamanu/fake-data/fake';
import {
  createLabTestTypes,
  randomSensitiveLabRequest,
} from '@tamanu/database/demoData/labRequests';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { createTestContext } from '../utilities';

describe('Labs', () => {
  let patientId = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    const patient = await models.Patient.create(await createDummyPatient(models));
    patientId = patient.id;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  it('should record a lab request', async () => {
    const labRequest = await randomLabRequest(models, {
      patientId,
    });
    const response = await app.post('/api/labRequest').send(labRequest);
    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest).toBeTruthy();
    expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);

    const createdTests = await models.LabTest.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdTests).toHaveLength(labRequest.labTestTypeIds.length);
    expect(createdTests.every(x => x.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED));

    const createdLogs = await models.LabRequestLog.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdLogs).toHaveLength(1);
    expect(createdLogs[0].status).toBe(LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);
  });

  describe('default specimen type on category', () => {
    const createCategoryWithDefault = async specimenTypeId => {
      const category = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      });
      if (specimenTypeId) {
        await models.ReferenceDataRelation.create({
          referenceDataParentId: category.id,
          referenceDataId: specimenTypeId,
          type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
        });
      }
      return category;
    };

    it('exposes the category default specimen type on GET /labTestType', async () => {
      const specimenType = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.SPECIMEN_TYPE,
      });
      const category = await createCategoryWithDefault(specimenType.id);
      const testType = await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: category.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        isSensitive: false,
      });

      const response = await app.get('/api/labTestType');
      expect(response).toHaveSucceeded();
      const returned = response.body.find(labTest => labTest.id === testType.id);
      expect(returned?.category?.defaultSpecimenTypeId).toBe(specimenType.id);
    });

    it('returns a null category default when none is set', async () => {
      const category = await createCategoryWithDefault(null);
      const testType = await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: category.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        isSensitive: false,
      });

      const response = await app.get('/api/labTestType');
      expect(response).toHaveSucceeded();
      const returned = response.body.find(labTest => labTest.id === testType.id);
      expect(returned?.category?.defaultSpecimenTypeId).toBeNull();
    });

    it('exposes the category default on GET /labTestPanel', async () => {
      const specimenType = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.SPECIMEN_TYPE,
      });
      const category = await createCategoryWithDefault(specimenType.id);
      const panel = await models.LabTestPanel.create({
        ...fake(models.LabTestPanel),
        categoryId: category.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const response = await app.get('/api/labTestPanel');
      expect(response).toHaveSucceeded();
      const returned = response.body.find(labPanel => labPanel.id === panel.id);
      expect(returned?.category?.defaultSpecimenTypeId).toBe(specimenType.id);
    });

    it('exposes the category default on GET /labRequest/:id', async () => {
      const specimenType = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: REFERENCE_TYPES.SPECIMEN_TYPE,
      });
      const category = await createCategoryWithDefault(specimenType.id);
      const createResponse = await app
        .post('/api/labRequest')
        .send(await randomLabRequest(models, { patientId, categoryId: category.id }));
      expect(createResponse).toHaveSucceeded();

      const response = await app.get(`/api/labRequest/${createResponse.body[0].id}`);
      expect(response).toHaveSucceeded();
      expect(response.body.category?.defaultSpecimenTypeId).toBe(specimenType.id);
    });

    it('returns a null category default on GET /labRequest/:id when none is set', async () => {
      const category = await createCategoryWithDefault(null);
      const createResponse = await app
        .post('/api/labRequest')
        .send(await randomLabRequest(models, { patientId, categoryId: category.id }));
      expect(createResponse).toHaveSucceeded();

      const response = await app.get(`/api/labRequest/${createResponse.body[0].id}`);
      expect(response).toHaveSucceeded();
      expect(response.body.category?.defaultSpecimenTypeId).toBeNull();
    });
  });

  it('should record two lab requests with one test type each', async () => {
    const categories = await models.ReferenceData.findAll({
      where: {
        type: 'labTestCategory',
      },
    });
    const category1 = categories[0].id;
    const category2 = categories[1].id;
    const labRequest = await randomLabRequest(models, {
      patientId,
      categoryId: category1,
    });
    const labRequest2 = await randomLabRequest(models, {
      patientId,
      categoryId: category2,
    });

    const response = await app.post('/api/labRequest').send({
      ...labRequest,
      labTestTypeIds: [...labRequest.labTestTypeIds, ...labRequest2.labTestTypeIds],
    });
    expect(response).toHaveSucceeded();

    const requests = [labRequest, labRequest2];
    for (let i = 0; i < requests.length; i++) {
      const createdRequest = await models.LabRequest.findByPk(response.body[i].id);
      expect(createdRequest).toBeTruthy();
      expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);

      const createdTests = await models.LabTest.findAll({
        where: { labRequestId: createdRequest.id },
      });
      expect(createdTests).toHaveLength(requests[i].labTestTypeIds.length);
      expect(createdTests.every(x => x.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED));

      const createdLogs = await models.LabRequestLog.findAll({
        where: { labRequestId: createdRequest.id },
      });
      expect(createdLogs).toHaveLength(1);
      expect(createdLogs[0].status).toBe(LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);
    }
  });

  it('it should create one record only when the category is the same', async () => {
    const categories = await models.ReferenceData.findAll({
      where: {
        type: 'labTestCategory',
      },
    });
    const category1 = categories[0].id;
    const labRequest = await randomLabRequest(models, {
      patientId,
      categoryId: category1,
    });
    const labRequest2 = await randomLabRequest(models, {
      patientId,
      categoryId: category1,
    });
    const labTestTypeIds = [...labRequest.labTestTypeIds, ...labRequest2.labTestTypeIds];
    const response = await app.post('/api/labRequest').send({
      ...labRequest,
      labTestTypeIds,
    });
    expect(response).toHaveSucceeded();
    expect(response.body.length).toEqual(1);
    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest).toBeTruthy();
    expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);
    const createdTests = await models.LabTest.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdTests).toHaveLength(labTestTypeIds.length);
  });

  it('should record a lab request with a note', async () => {
    const data = await randomLabRequest(models, {
      patientId,
    });
    const content = chance.string();

    const response = await app.post('/api/labRequest').send({
      ...data,
      note: {
        date: chance.date(),
        content,
      },
    });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(response.body[0].id, {
      include: 'notes',
    });
    expect(labRequest).toBeTruthy();

    expect(labRequest.notes).toHaveLength(1);
    expect(labRequest.notes[0]).toHaveProperty('content', content);
  });

  it('should record a lab request with a note', async () => {
    const data = await randomLabRequest(models, {
      patientId,
    });
    const content = chance.string();

    const response = await app.post('/api/labRequest').send({
      ...data,
      note: {
        date: chance.date(),
        content,
      },
    });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(response.body[0].id, {
      include: 'notes',
    });
    expect(labRequest).toBeTruthy();

    expect(labRequest.notes).toHaveLength(1);
    expect(labRequest.notes[0]).toHaveProperty('content', content);
  });

  it('should record a lab request with a Lab Test Panel', async () => {
    const labTestPanel = await models.LabTestPanel.create({
      name: 'Demo test panel',
      code: 'demo-test-panel',
    });

    const labTestTypes = await createTestTypesForPanel(models, labTestPanel);

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const response = await app
      .post('/api/labRequest')
      .send({ panelIds: [labTestPanel.id], encounterId: encounter.id });

    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest).toBeTruthy();
    expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);

    const createdTests = await models.LabTest.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdTests).toHaveLength(labTestTypes.length);
    expect(createdTests.every(x => x.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED));

    const createdLogs = await models.LabRequestLog.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdLogs).toHaveLength(1);
    expect(createdLogs[0].status).toBe(LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);
  });

  it('records both panel and individual requests from a mixed submission', async () => {
    const labTestPanel = await models.LabTestPanel.create({
      name: `Mixed panel ${chance.guid()}`,
      code: chance.guid(),
    });
    await createTestTypesForPanel(models, labTestPanel);

    const { id: labTestCategoryId } = await models.ReferenceData.create({
      type: 'labTestCategory',
      name: `Category ${chance.guid()}`,
      code: chance.guid(),
    });
    const individualTest = await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId,
      isSensitive: false,
      availableFacilities: null,
    });

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const response = await app.post('/api/labRequest').send({
      panelIds: [labTestPanel.id],
      labTestTypeIds: [individualTest.id],
      encounterId: encounter.id,
    });

    expect(response).toHaveSucceeded();
    // One request from the panel, one from the individual test's category — previously the
    // individual test was silently dropped when panels were present.
    expect(response.body).toHaveLength(2);

    const createdRequests = await models.LabRequest.findAll({
      where: { id: response.body.map(request => request.id) },
      include: [{ model: models.LabTestPanelRequest, as: 'labTestPanelRequests' }],
    });
    const panelRequest = createdRequests.find(request => request.labTestPanelRequests.length > 0);
    const individualRequest = createdRequests.find(
      request => request.labTestPanelRequests.length === 0,
    );
    expect(panelRequest).toBeTruthy();
    expect(individualRequest).toBeTruthy();
    expect(individualRequest.labTestCategoryId).toBe(labTestCategoryId);

    const individualTests = await models.LabTest.findAll({
      where: { labRequestId: individualRequest.id },
    });
    expect(individualTests).toHaveLength(1);
    expect(individualTests[0].labTestTypeId).toBe(individualTest.id);
  });

  it('exposes each request\'s panels and individual tests for the category tooltip', async () => {
    const labTestPanel = await models.LabTestPanel.create({
      name: `Tooltip panel ${chance.guid()}`,
      code: chance.guid(),
    });
    await createTestTypesForPanel(models, labTestPanel);

    const { id: labTestCategoryId } = await models.ReferenceData.create({
      type: 'labTestCategory',
      name: `Category ${chance.guid()}`,
      code: chance.guid(),
    });
    const individualTest = await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId,
      isSensitive: false,
      availableFacilities: null,
    });

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const createResponse = await app.post('/api/labRequest').send({
      panelIds: [labTestPanel.id],
      labTestTypeIds: [individualTest.id],
      encounterId: encounter.id,
    });
    expect(createResponse).toHaveSucceeded();

    const listResponse = await app.get(`/api/encounter/${encounter.id}/labRequests`);
    expect(listResponse).toHaveSucceeded();

    // A panel request lists its panel name (its member tests are represented by the panel); an
    // individual request lists the loose test's name.
    const rows = listResponse.body.data;
    expect(rows.some(row => row.testsAndPanelNames === labTestPanel.name)).toBe(true);
    expect(rows.some(row => row.testsAndPanelNames === individualTest.name)).toBe(true);
  });

  it('includes panel member tests on GET /api/labTestPanel', async () => {
    const labTestPanel = await models.LabTestPanel.create({
      name: `Contract panel ${chance.guid()}`,
      code: chance.guid(),
    });
    const labTestTypes = await createTestTypesForPanel(models, labTestPanel);

    const response = await app.get('/api/labTestPanel');
    expect(response).toHaveSucceeded();

    const panel = response.body.find(item => item.id === labTestPanel.id);
    expect(panel).toBeTruthy();
    expect(panel.labTestTypes).toHaveLength(labTestTypes.length);
    const member = panel.labTestTypes[0];
    expect(member).toHaveProperty('id');
    expect(member).toHaveProperty('code');
    expect(member).toHaveProperty('name');
    expect(member.LabTestPanelLabTestTypes).toHaveProperty('order');
  });

  describe('sensitive test type via panel', () => {
    // `app` uses the practitioner role, which does NOT hold `create SensitiveLabRequest`.
    const createPanelWithTestType = async ({ isSensitive }) => {
      const { id: labTestCategoryId } = await models.ReferenceData.create({
        type: 'labTestCategory',
        name: `Category ${chance.guid()}`,
        code: chance.guid(),
      });
      const labTestType = await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId,
        isSensitive,
        availableFacilities: null,
      });
      const panel = await models.LabTestPanel.create({
        name: `Panel ${chance.guid()}`,
        code: chance.guid(),
      });
      await models.LabTestPanelLabTestTypes.create({
        labTestPanelId: panel.id,
        labTestTypeId: labTestType.id,
      });
      return panel;
    };

    const postPanelLabRequest = async panel => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId,
      });
      return app
        .post('/api/labRequest')
        .send({ panelIds: [panel.id], encounterId: encounter.id });
    };

    it('forbids a panel containing a sensitive test type without SensitiveLabRequest permission', async () => {
      const panel = await createPanelWithTestType({ isSensitive: true });
      const response = await postPanelLabRequest(panel);
      expect(response).toBeForbidden();
    });

    it('allows a panel with only non-sensitive test types', async () => {
      const panel = await createPanelWithTestType({ isSensitive: false });
      const response = await postPanelLabRequest(panel);
      expect(response).toHaveSucceeded();
    });

    it('excludes sensitive panel members from GET /api/labTestPanel without permission', async () => {
      const panel = await createPanelWithTestType({ isSensitive: true });
      const response = await app.get('/api/labTestPanel');
      expect(response).toHaveSucceeded();
      const returnedPanel = response.body.find(item => item.id === panel.id);
      expect(returnedPanel).toBeTruthy();
      expect(returnedPanel.labTestTypes).toHaveLength(0);
    });

    it('includes non-sensitive panel members on GET /api/labTestPanel', async () => {
      const panel = await createPanelWithTestType({ isSensitive: false });
      const response = await app.get('/api/labTestPanel');
      const returnedPanel = response.body.find(item => item.id === panel.id);
      expect(returnedPanel.labTestTypes).toHaveLength(1);
    });
  });

  it('should record samples for panels', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const labTestPanel = await models.LabTestPanel.create({
      name: 'Demo test panel',
      code: 'demo-test-panel',
      categoryId: category.id,
    });
    const labTestTypes = await createTestTypesForPanel(models, labTestPanel);

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const sampleTime = '2023-06-09 00:00:00';

    const specimenType = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'specimenType',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    // Samples are keyed by category so every request in the category shares the sample.
    const sampleDetails = {
      [category.id]: {
        sampleTime,
        specimenTypeId: specimenType.id,
      },
    };
    const response = await app.post('/api/labRequest').send({
      panelIds: [labTestPanel.id],
      encounterId: encounter.id,
      sampleDetails,
    });
    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest).toBeTruthy();
    expect(createdRequest.specimenAttached).toBe(true);
    expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    const createdTests = await models.LabTest.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdTests).toHaveLength(labTestTypes.length);
    expect(
      createdTests.every(
        x => x.status === LAB_REQUEST_STATUSES.RECEPTION_PENDING && x.sampleTime === sampleTime,
      ),
    );

    const createdLogs = await models.LabRequestLog.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdLogs).toHaveLength(1);
    expect(createdLogs[0].status).toBe(LAB_REQUEST_STATUSES.RECEPTION_PENDING);
  });

  it('shares one category sample between a panel and an individual test in the same category', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const labTestPanel = await models.LabTestPanel.create({
      name: `Shared category panel ${chance.guid()}`,
      code: chance.guid(),
      categoryId: category.id,
    });
    await createTestTypesForPanel(models, labTestPanel);
    const individualTest = await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId: category.id,
      isSensitive: false,
      availableFacilities: null,
    });

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const sampleTime = '2023-06-09 00:00:00';
    const specimenType = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'specimenType',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );

    // A panel and a same-category individual test collapse into one request for that category, and
    // the category's sample applies to it.
    const response = await app.post('/api/labRequest').send({
      panelIds: [labTestPanel.id],
      labTestTypeIds: [individualTest.id],
      encounterId: encounter.id,
      sampleDetails: {
        [category.id]: { sampleTime, specimenTypeId: specimenType.id },
      },
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveLength(1);

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id, {
      include: [{ model: models.LabTestPanelRequest, as: 'labTestPanelRequests' }],
    });
    expect(createdRequest.labTestCategoryId).toBe(category.id);
    expect(createdRequest.labTestPanelRequests).toHaveLength(1);
    expect(createdRequest.sampleTime).toBe(sampleTime);
    expect(createdRequest.specimenTypeId).toBe(specimenType.id);
    expect(createdRequest.specimenAttached).toBe(true);
    expect(createdRequest.status).toBe(LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    // The individual test carries no panel attribution; the panel's members are attributed to it.
    const tests = await models.LabTest.findAll({ where: { labRequestId: createdRequest.id } });
    const individualRow = tests.find(test => test.labTestTypeId === individualTest.id);
    expect(individualRow.labTestPanelRequestId).toBeFalsy();
    const panelRows = tests.filter(test => test.labTestPanelRequestId);
    expect(panelRows.length).toBeGreaterThan(0);
  });

  it('creates one lab test per panel when two panels on a request share a test type', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const sharedType = await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId: category.id,
      isSensitive: false,
      availableFacilities: null,
    });
    const makePanel = async () => {
      const panel = await models.LabTestPanel.create({
        name: `Shared type panel ${chance.guid()}`,
        code: chance.guid(),
        categoryId: category.id,
      });
      await models.LabTestPanelLabTestTypes.create({
        labTestPanelId: panel.id,
        labTestTypeId: sharedType.id,
      });
      return panel;
    };
    const panelA = await makePanel();
    const panelB = await makePanel();

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const response = await app.post('/api/labRequest').send({
      panelIds: [panelA.id, panelB.id],
      encounterId: encounter.id,
    });
    expect(response).toHaveSucceeded();
    // Both panels share the one category, so one request holds both.
    expect(response.body).toHaveLength(1);

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id, {
      include: [{ model: models.LabTestPanelRequest, as: 'labTestPanelRequests' }],
    });
    expect(createdRequest.labTestPanelRequests).toHaveLength(2);

    const tests = await models.LabTest.findAll({
      where: { labRequestId: createdRequest.id, labTestTypeId: sharedType.id },
    });
    // One row per panel for the shared type, each attributed to a distinct panel request.
    expect(tests).toHaveLength(2);
    expect(new Set(tests.map(test => test.labTestPanelRequestId)).size).toBe(2);
  });

  it('groups a category-less panel under the category its test types share', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const makeType = () =>
      models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: category.id,
        isSensitive: false,
        availableFacilities: null,
      });
    const panel = await models.LabTestPanel.create({
      name: `Category-less shared ${chance.guid()}`,
      code: chance.guid(),
      categoryId: null,
    });
    for (const type of [await makeType(), await makeType()]) {
      await models.LabTestPanelLabTestTypes.create({
        labTestPanelId: panel.id,
        labTestTypeId: type.id,
      });
    }

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const response = await app.post('/api/labRequest').send({
      panelIds: [panel.id],
      encounterId: encounter.id,
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveLength(1);
    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest.labTestCategoryId).toBe(category.id);
  });

  it('gives a category-less panel whose test types span categories its own request', async () => {
    const makeCategory = () =>
      models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: 'labTestCategory',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        }),
      );
    const category1 = await makeCategory();
    const category2 = await makeCategory();
    const makeType = categoryId =>
      models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: categoryId,
        isSensitive: false,
        availableFacilities: null,
      });
    const panel = await models.LabTestPanel.create({
      name: `Category-less spanning ${chance.guid()}`,
      code: chance.guid(),
      categoryId: null,
    });
    for (const type of [await makeType(category1.id), await makeType(category2.id)]) {
      await models.LabTestPanelLabTestTypes.create({
        labTestPanelId: panel.id,
        labTestTypeId: type.id,
      });
    }

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const response = await app.post('/api/labRequest').send({
      panelIds: [panel.id],
      encounterId: encounter.id,
    });
    expect(response).toHaveSucceeded();
    expect(response.body).toHaveLength(1);
    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest.labTestCategoryId).toBeFalsy();
  });

  it('returns every test row for a multi-panel request, including the duplicated shared type', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const sharedType = await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId: category.id,
      isSensitive: false,
      availableFacilities: null,
    });
    const makePanel = async () => {
      const panel = await models.LabTestPanel.create({
        name: `Multi-panel tests ${chance.guid()}`,
        code: chance.guid(),
        categoryId: category.id,
      });
      await models.LabTestPanelLabTestTypes.create({
        labTestPanelId: panel.id,
        labTestTypeId: sharedType.id,
      });
      return panel;
    };
    const panelA = await makePanel();
    const panelB = await makePanel();

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });
    const {
      body: [labRequest],
    } = await app.post('/api/labRequest').send({
      panelIds: [panelA.id, panelB.id],
      encounterId: encounter.id,
    });

    const response = await app.get(`/api/labRequest/${labRequest.id}/tests`);
    expect(response).toHaveSucceeded();
    expect(response.body.count).toBe(2);
    const sharedRows = response.body.data.filter(test => test.labTestTypeId === sharedType.id);
    expect(sharedRows).toHaveLength(2);
  });

  it('orders panel tests first (reference-data order) then individual tests alphabetically (card D4)', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const makeType = name =>
      models.LabTestType.create({
        ...fake(models.LabTestType),
        name,
        labTestCategoryId: category.id,
        isSensitive: false,
        availableFacilities: null,
      });
    const makePanel = async (name, orderedTypeNames) => {
      const panel = await models.LabTestPanel.create({
        name,
        code: chance.guid(),
        categoryId: category.id,
      });
      for (let order = 0; order < orderedTypeNames.length; order++) {
        const type = await makeType(orderedTypeNames[order]);
        await models.LabTestPanelLabTestTypes.create({
          labTestPanelId: panel.id,
          labTestTypeId: type.id,
          order,
        });
      }
      return panel;
    };

    // Created Zebra-first so creation order differs from the alphabetical order the view must use;
    // member-test names are chosen so alphabetical order would differ from reference-data order.
    const zebra = await makePanel('Zebra panel', ['Mango', 'Cherry']);
    const apple = await makePanel('Apple panel', ['Yttrium', 'Boron']);
    const bravo = await makeType('Bravo');
    const delta = await makeType('Delta');

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });
    const {
      body: [labRequest],
    } = await app.post('/api/labRequest').send({
      panelIds: [zebra.id, apple.id],
      labTestTypeIds: [delta.id, bravo.id],
      encounterId: encounter.id,
    });

    // A reflex test arrives later from the lab with no panel attribution; it is an individual test.
    const aardvark = await makeType('Aardvark reflex');
    await models.LabTest.create({
      labRequestId: labRequest.id,
      labTestTypeId: aardvark.id,
      categoryId: category.id,
    });

    const response = await app.get(`/api/labRequest/${labRequest.id}/tests`);
    expect(response).toHaveSucceeded();
    expect(response.body.data.map(test => test.labTestType.name)).toEqual([
      'Yttrium',
      'Boron', // Apple panel, reference-data order
      'Mango',
      'Cherry', // Zebra panel, reference-data order
      'Aardvark reflex',
      'Bravo',
      'Delta', // individual tests, alphabetical
    ]);

    const rowByName = Object.fromEntries(
      response.body.data.map(test => [test.labTestType.name, test]),
    );
    expect(rowByName['Yttrium'].labTestPanel.name).toBe('Apple panel');
    expect(rowByName['Mango'].labTestPanel.name).toBe('Zebra panel');
    expect(rowByName['Bravo'].labTestPanel).toBeNull();
    expect(rowByName['Aardvark reflex'].labTestPanel).toBeNull();

    // The order is stable across pages.
    const paged = await app.get(
      `/api/labRequest/${labRequest.id}/tests?page=1&rowsPerPage=2`,
    );
    expect(paged.body.count).toBe(7);
    expect(paged.body.data.map(test => test.labTestType.name)).toEqual(['Mango', 'Cherry']);
  });

  it('groups a historical single-panel request under its panel via inference (card D4)', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const panel = await models.LabTestPanel.create({
      name: 'Legacy panel',
      code: chance.guid(),
      categoryId: category.id,
    });
    const makeType = name =>
      models.LabTestType.create({
        ...fake(models.LabTestType),
        name,
        labTestCategoryId: category.id,
        isSensitive: false,
        availableFacilities: null,
      });
    // Member tests whose reference-data order differs from alphabetical, so the assertion proves the
    // panel's order wins rather than the individual-section alphabetical sort.
    const first = await makeType('Zulu');
    const second = await makeType('Alpha');
    await models.LabTestPanelLabTestTypes.create({
      labTestPanelId: panel.id,
      labTestTypeId: first.id,
      order: 0,
    });
    await models.LabTestPanelLabTestTypes.create({
      labTestPanelId: panel.id,
      labTestTypeId: second.id,
      order: 1,
    });

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });
    const {
      body: [labRequest],
    } = await app.post('/api/labRequest').send({
      panelIds: [panel.id],
      encounterId: encounter.id,
    });

    // Simulate a request migrated from the single-panel era: its tests were never stamped with a
    // panel request, so grouping has to be inferred from the request's single panel request.
    await models.LabTest.update(
      { labTestPanelRequestId: null },
      { where: { labRequestId: labRequest.id } },
    );

    const response = await app.get(`/api/labRequest/${labRequest.id}/tests`);
    expect(response).toHaveSucceeded();
    expect(response.body.data.map(test => test.labTestType.name)).toEqual(['Zulu', 'Alpha']);
    expect(response.body.data.every(test => test.labTestPanel?.name === 'Legacy panel')).toBe(true);
  });

  it('rejects the submission when a panel has no test types available at the facility', async () => {
    const category = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'labTestCategory',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const unavailableType = await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId: category.id,
      isSensitive: false,
      availableFacilities: [`nonexistent-facility-${chance.guid()}`],
    });
    const panel = await models.LabTestPanel.create({
      name: `Unavailable panel ${chance.guid()}`,
      code: chance.guid(),
      categoryId: category.id,
    });
    await models.LabTestPanelLabTestTypes.create({
      labTestPanelId: panel.id,
      labTestTypeId: unavailableType.id,
    });

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const response = await app.post('/api/labRequest').send({
      panelIds: [panel.id],
      encounterId: encounter.id,
    });
    expect(response).toHaveRequestError();

    const created = await models.LabRequest.findAll({ where: { encounterId: encounter.id } });
    expect(created).toHaveLength(0);
  });

  it('should not record a lab request with an invalid testTypeId', async () => {
    const labTestTypeIds = ['invalid-test-type-id', 'another-invalid-test-type-id'];
    const response = await app.post('/api/labRequest').send({
      patientId,
      labTestTypeIds,
    });
    expect(response).toHaveRequestError();

    const createdRequest = await models.LabRequest.findByPk(response.body.id);
    expect(createdRequest).toBeFalsy();
  });

  test.todo('should not record a lab request with zero tests');

  it('should update the status of a lab request', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const user = await app.get('/api/user/me');
    const response = await app
      .put(`/api/labRequest/${requestId}`)
      .send({ status, userId: user.body.id });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });

  it('should update the specimen attached', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const specimenType = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'specimenType',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const user = await app.get('/api/user/me');
    const response = await app
      .put(`/api/labRequest/${requestId}`)
      .send({ specimenTypeId: specimenType.id, userId: user.body.id });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('specimenAttached', true);
  });

  it('should publish a lab request', async () => {
    const user = await app.get('/api/user/me');
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, {
        patientId,
        requestedById: user.body.id,
        encounterId: encounter.id,
      }),
    );
    const status = LAB_REQUEST_STATUSES.PUBLISHED;
    const response = await app
      .put(`/api/labRequest/${requestId}`)
      .send({ status, userId: user.body.id });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });

  describe('Priority', () => {
    let priorityA;
    let priorityB;

    beforeAll(async () => {
      priorityA = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: 'labTestPriority',
      });
      priorityB = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: 'labTestPriority',
      });
    });

    afterEach(async () => {
      await models.Setting.set('features.labRequest.priorityEditable', true);
    });

    describe.each([
      ['sample not collected', LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED],
      ['reception pending', LAB_REQUEST_STATUSES.RECEPTION_PENDING],
      ['to be verified', LAB_REQUEST_STATUSES.TO_BE_VERIFIED],
    ])('when status is %s', (_label, status) => {
      it('should allow updating priority when priorityEditable is true (default)', async () => {
        const { id: requestId } = await models.LabRequest.createWithTests(
          await randomLabRequest(models, {
            patientId,
            status,
            labTestPriorityId: priorityA.id,
          }),
        );
        const response = await app
          .put(`/api/labRequest/${requestId}`)
          .send({ labTestPriorityId: priorityB.id });
        expect(response).toHaveSucceeded();

        const labRequest = await models.LabRequest.findByPk(requestId);
        expect(labRequest).toHaveProperty('labTestPriorityId', priorityB.id);
      });

      it('should reject updating priority when priorityEditable is false', async () => {
        await models.Setting.set('features.labRequest.priorityEditable', false);

        const { id: requestId } = await models.LabRequest.createWithTests(
          await randomLabRequest(models, {
            patientId,
            status,
            labTestPriorityId: priorityA.id,
          }),
        );
        const response = await app
          .put(`/api/labRequest/${requestId}`)
          .send({ labTestPriorityId: priorityB.id });
        expect(response).toHaveRequestError();

        const labRequest = await models.LabRequest.findByPk(requestId);
        expect(labRequest).toHaveProperty('labTestPriorityId', priorityA.id);
      });
    });

    it('should still allow updating other fields when priorityEditable is false', async () => {
      await models.Setting.set('features.labRequest.priorityEditable', false);

      const { id: requestId } = await models.LabRequest.createWithTests(
        await randomLabRequest(models, {
          patientId,
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          labTestPriorityId: priorityA.id,
        }),
      );
      const specimenType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: 'specimenType',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        }),
      );
      const response = await app
        .put(`/api/labRequest/${requestId}`)
        .send({ specimenTypeId: specimenType.id });
      expect(response).toHaveSucceeded();

      const labRequest = await models.LabRequest.findByPk(requestId);
      expect(labRequest).toHaveProperty('specimenAttached', true);
      expect(labRequest).toHaveProperty('labTestPriorityId', priorityA.id);
    });

    it('should allow a no-op priority update when priorityEditable is false', async () => {
      await models.Setting.set('features.labRequest.priorityEditable', false);

      const { id: requestId } = await models.LabRequest.createWithTests(
        await randomLabRequest(models, {
          patientId,
          status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
          labTestPriorityId: priorityA.id,
        }),
      );
      const response = await app
        .put(`/api/labRequest/${requestId}`)
        .send({ labTestPriorityId: priorityA.id });
      expect(response).toHaveSucceeded();

      const labRequest = await models.LabRequest.findByPk(requestId);
      expect(labRequest).toHaveProperty('labTestPriorityId', priorityA.id);
    });
  });

  it('should not fetch lab test types directly from general labTestType get route when visibilityStatus set to "panelsOnly" or "historical"', async () => {
    const makeLabTestType = async visibilityStatus => {
      const category = await models.ReferenceData.create({
        ...fake(models.ReferenceData),
        type: 'labTestCategory',
      });
      const { id } = category;

      await models.LabTestType.create({
        ...fake(models.LabTestType),
        visibilityStatus,
        labTestCategoryId: id,
      });
    };

    await models.LabTestType.truncate({ cascade: true });
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.CURRENT);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.CURRENT);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.CURRENT);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.PANEL_ONLY);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.PANEL_ONLY);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.PANEL_ONLY);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.HISTORICAL);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.HISTORICAL);
    await makeLabTestType(LAB_TEST_TYPE_VISIBILITY_STATUSES.HISTORICAL);

    const result = await app.get('/api/labTestType');
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.length).toBe(3);
    body.forEach(labTestType => {
      expect(labTestType.visibilityStatus).toBe(LAB_TEST_TYPE_VISIBILITY_STATUSES.CURRENT);
    });
  });

  it('should not fetch sensitive lab test types without permission', async () => {
    await models.LabTestType.truncate({ cascade: true });
    const { id: nonSensitiveCategoryId } = await models.ReferenceData.create({
      type: 'labTestCategory',
      name: 'Non Sensitive Test Laboratory',
      code: 'NONSENSITIVETESTLABORATORY',
    });
    await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId: nonSensitiveCategoryId,
    });

    const { id: sensitiveCategoryId } = await models.ReferenceData.create({
      type: 'labTestCategory',
      name: 'Sensitive Test Laboratory',
      code: 'SENSITIVETESTLABORATORY',
    });
    await models.LabTestType.create({
      ...fake(models.LabTestType),
      labTestCategoryId: sensitiveCategoryId,
      isSensitive: true,
    });

    const result = await app.get('/api/labTestType');
    expect(result).toHaveSucceeded();
    expect(result.body.length).toBe(1);
    expect(result.body[0].isSensitive).toBe(false);
  });

  it('should only retrieve panels with a visibilityStatus status of current', async () => {
    await models.LabTestPanel.create({
      name: 'Historical test panel',
      code: 'historical-test-panel',
      visibilityStatus: 'historical',
    });
    const result = await app.get('/api/labTestPanel');
    expect(result).toHaveSucceeded();
    const { body } = result;

    expect(body.every(panel => panel.visibilityStatus === 'current')).toBeTruthy();
  });

  describe('Lab test results', () => {
    let labRequest;

    beforeEach(async () => {
      labRequest = await models.LabRequest.createWithTests(
        await randomLabRequest(models, { patientId }),
      );
    });

    describe('GET individual', () => {
      it('should get a lab test', async () => {
        const [labTest] = await labRequest.getTests();
        const response = await app.get(`/api/labTest/${labTest.id}`);
        expect(response).toHaveSucceeded();
        expect(response.body.labRequestId).toBe(labRequest.id);
      });

      it('should error if lab test is sensitive', async () => {
        const labRequestData = await randomSensitiveLabRequest(models, {
          patientId,
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        });
        const sensitiveLabRequest = await models.LabRequest.createWithTests(labRequestData);
        const [sensitiveTest] = await sensitiveLabRequest.getTests();
        const response = await app.get(`/api/labTest/${sensitiveTest.id}`);
        expect(response).toBeForbidden();
      });
    });

    describe('GET history', () => {
      it('should get lab test result history, filtering consecutive duplicates', async () => {
        const [labTest] = await labRequest.getTests();

        await labTest.update({ result: 'First result' });
        await labTest.update({ result: 'Second result', secondaryResult: 'Positive' });
        await labTest.update({ result: 'Second result' }); // Duplicate result — should be skipped
        await labTest.update({ result: 'Third result' });
        await labTest.update({ secondaryResult: 'Negative' });

        const response = await app.get(`/api/labTest/${labTest.id}/history`);
        expect(response).toHaveSucceeded();

        const historyItems = response.body;
        const resultChanges = historyItems.filter(h => h.fieldType === 'result');
        const secondaryChanges = historyItems.filter(h => h.fieldType === 'secondaryResult');

        // 3 distinct result values, 2 distinct secondary values, no phantom entries
        expect(resultChanges.map(h => h.result)).toEqual([
          'Third result',
          'Second result',
          'First result',
        ]);
        expect(secondaryChanges.map(h => h.result)).toEqual(['Negative', 'Positive']);

        // Newest first
        expect(historyItems[0]).toMatchObject({
          fieldType: 'secondaryResult',
          result: 'Negative',
        });
      });

      it('should error if lab test is sensitive', async () => {
        const labRequestData = await randomSensitiveLabRequest(models, {
          patientId,
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        });
        const sensitiveLabRequest = await models.LabRequest.createWithTests(labRequestData);
        const [sensitiveTest] = await sensitiveLabRequest.getTests();
        const response = await app.get(`/api/labTest/${sensitiveTest.id}/history`);
        expect(response).toBeForbidden();
      });
    });

    describe('GET list', () => {
      it('should get a list of tests included from lab request', async () => {
        const response = await app.get(`/api/labRequest/${labRequest.id}/tests`);
        expect(response).toHaveSucceeded();
        expect(response.body).toMatchObject({
          count: 2,
          data: expect.any(Array),
        });
      });

      it('should exclude sensitive tests', async () => {
        const labRequestData = await randomSensitiveLabRequest(models, {
          patientId,
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        });
        const sensitiveLabRequest = await models.LabRequest.createWithTests(labRequestData);

        const response = await app.get(`/api/labRequest/${sensitiveLabRequest.id}/tests`);
        expect(response).toHaveSucceeded();
        expect(response.body).toMatchObject({
          count: 0,
          data: expect.any(Array),
        });
      });
    });

    describe('PUT', () => {
      test.todo('should fail to record a number test result against a string test');
      test.todo('should fail to record a string test result against an number test');

      it('should only update tests with changes', async () => {
        const [test1, test2] = await labRequest.getTests();
        const mockResult = 'Mock result';
        const mockVerification = 'verified';
        const response = await app.put(`/api/labRequest/${labRequest.id}/tests`).send({
          labTests: {
            [test1.id]: {
              result: mockResult,
              verification: mockVerification,
            },
            [test2.id]: {
              result: test2.result,
            },
          },
        });
        expect(response).toHaveSucceeded();
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            id: test1.id,
            result: mockResult,
            verification: mockVerification,
          }),
        );
      });

      it('should update multiple entries with correct data', async () => {
        const [test1, test2] = await labRequest.getTests();
        const mockResult = 'Mock result';
        const mockVerification = 'verified';
        const mockResult2 = 'Mock result2';
        const mockVerification2 = 'also verified';
        const response = await app.put(`/api/labRequest/${labRequest.id}/tests`).send({
          labTests: {
            [test1.id]: {
              result: mockResult,
              verification: mockVerification,
            },
            [test2.id]: {
              result: mockResult2,
              verification: mockVerification2,
            },
          },
        });
        expect(response).toHaveSucceeded();
        expect(response.body).toHaveLength(2);
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: test1.id }),
            expect.objectContaining({ id: test2.id }),
          ]),
        );
      });

      it('should fail with not found if body contains an invalid test id', async () => {
        const [test1] = await labRequest.getTests();
        const mockResult = 'Mock result';
        const mockVerification = 'verified';
        const response = await app.put(`/api/labRequest/${labRequest.id}/tests`).send({
          labTests: {
            [test1.id]: {
              result: mockResult,
              verification: mockVerification,
            },
            invalidTestId: {
              result: mockResult,
              verification: mockVerification,
            },
          },
        });
        expect(response).toHaveRequestError(404);
      });

      it('should fail with forbidden if trying to update sensitive lab test', async () => {
        const labRequestData = await randomSensitiveLabRequest(models, {
          patientId,
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        });
        const sensitiveLabRequest = await models.LabRequest.createWithTests(labRequestData);
        const [sensitiveTest] = await sensitiveLabRequest.getTests();
        const mockResult = 'Mock result';
        const mockVerification = 'verified';
        const response = await app.put(`/api/labRequest/${sensitiveLabRequest.id}/tests`).send({
          labTests: {
            [sensitiveTest.id]: {
              result: mockResult,
              verification: mockVerification,
            },
          },
        });
        expect(response).toBeForbidden();
      });
    });
  });

  describe('Approved column', () => {
    const [facilityId] = selectFacilityIds(config);
    let testLocation;
    let testEncounter;
    let testInvoice;
    let labTestTypes;

    beforeAll(async () => {
      testLocation = await models.Location.create({
        ...fake(models.Location),
        facilityId,
      });
      testEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: testLocation.id,
        patientId,
      });
      testInvoice = await models.Invoice.create({
        encounterId: testEncounter.id,
        displayId: 'INV-LAB-APPROVED-TEST',
        status: INVOICE_STATUSES.IN_PROGRESS,
        date: getCurrentDateTimeString(),
      });
      // Create lab test types for testing
      labTestTypes = await createLabTestTypes(models);
    });

    beforeEach(async () => {
      await models.Setting.set('features.invoicing.enabled', true);
    });

    const createLabRequestWithPanel = async () => {
      const labTestPanel = await models.LabTestPanel.create({
        name: `Test panel ${chance.guid()}`,
        code: `test-panel-${chance.guid()}`,
      });
      await Promise.all(
        labTestTypes.map(ltt =>
          models.LabTestPanelLabTestTypes.create({
            labTestPanelId: labTestPanel.id,
            labTestTypeId: ltt.id,
          }),
        ),
      );

      const labRequest = await models.LabRequest.create({
        ...fake(models.LabRequest),
        encounterId: testEncounter.id,
        requestedById: app.user.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });

      const labTestPanelRequest = await models.LabTestPanelRequest.create({
        labTestPanelId: labTestPanel.id,
        encounterId: testEncounter.id,
        labRequestId: labRequest.id,
      });

      const labTests = await Promise.all(
        labTestTypes.map(ltt =>
          models.LabTest.create({
            labRequestId: labRequest.id,
            labTestPanelRequestId: labTestPanelRequest.id,
            labTestTypeId: ltt.id,
            status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          }),
        ),
      );

      return { labRequest, labTestPanelRequest, labTests };
    };

    const createLabRequestWithoutPanel = async () => {
      const labRequest = await models.LabRequest.create({
        ...fake(models.LabRequest),
        encounterId: testEncounter.id,
        requestedById: app.user.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });

      const labTests = await Promise.all(
        labTestTypes.map(ltt =>
          models.LabTest.create({
            labRequestId: labRequest.id,
            labTestTypeId: ltt.id,
            status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          }),
        ),
      );

      return { labRequest, labTests };
    };

    it('should not include approved when invoicing is disabled', async () => {
      await models.Setting.set('features.invoicing.enabled', false);
      await models.LabRequest.truncate({ cascade: true, force: true });

      const { labRequest, labTestPanelRequest } = await createLabRequestWithPanel();

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: labTestPanelRequest.id,
        sourceRecordType: 'LabTestPanelRequest',
        approved: true,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });

      const result = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).not.toBeDefined();
    });

    it('should be empty when no invoice items exist', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });
      const { labRequest } = await createLabRequestWithoutPanel();

      const result = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).not.toBeDefined();
    });

    it('represents every panel of a multi-panel request in the list and filters on any of them', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });
      const category = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: 'labTestCategory',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        }),
      );
      const sharedType = await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: category.id,
        isSensitive: false,
        availableFacilities: null,
      });
      const makePanel = async name => {
        const panel = await models.LabTestPanel.create({
          name,
          code: chance.guid(),
          categoryId: category.id,
        });
        await models.LabTestPanelLabTestTypes.create({
          labTestPanelId: panel.id,
          labTestTypeId: sharedType.id,
        });
        return panel;
      };
      const panelAlpha = await makePanel('Alpha panel');
      const panelBeta = await makePanel('Beta panel');

      const {
        body: [labRequest],
      } = await app.post('/api/labRequest').send({
        encounterId: testEncounter.id,
        panelIds: [panelAlpha.id, panelBeta.id],
        requestedById: app.user.id,
        date: new Date(),
      });

      const listed = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      const found = listed.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      // Both panels are represented; no single panel id is exposed for a multi-panel request.
      expect(found.labTestPanelName).toContain('Alpha panel');
      expect(found.labTestPanelName).toContain('Beta panel');
      expect(found.labTestPanelId).toBeFalsy();

      // Filtering by either panel returns the request.
      const filtered = await app.get(
        `/api/labRequest?facilityId=${facilityId}&labTestPanelId=${panelBeta.id}`,
      );
      expect(filtered.body.data.map(lr => lr.id)).toContain(labRequest.id);
    });

    it('should return true when panel invoice item is approved', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });
      const { labRequest, labTestPanelRequest } = await createLabRequestWithPanel();

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: labTestPanelRequest.id,
        sourceRecordType: 'LabTestPanelRequest',
        approved: true,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });

      const result = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(true);
    });

    it('should return false when panel invoice item is not approved', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });
      const { labRequest, labTestPanelRequest } = await createLabRequestWithPanel();

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: labTestPanelRequest.id,
        sourceRecordType: 'LabTestPanelRequest',
        approved: false,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });

      const result = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(false);
    });

    it('should return true when all lab test invoice items are approved', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });
      const { labRequest, labTests } = await createLabRequestWithoutPanel();

      for (const labTest of labTests) {
        await models.InvoiceItem.create({
          invoiceId: testInvoice.id,
          sourceRecordId: labTest.id,
          sourceRecordType: 'LabTest',
          approved: true,
          orderDate: new Date().toISOString(),
          quantity: 1,
          orderedByUserId: app.user.id,
        });
      }

      const result = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(true);
    });

    it('should return false when any lab test invoice item is not approved', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });
      const { labRequest, labTests } = await createLabRequestWithoutPanel();

      // First test approved
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: labTests[0].id,
        sourceRecordType: 'LabTest',
        approved: true,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });

      // Second test not approved
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: labTests[1].id,
        sourceRecordType: 'LabTest',
        approved: false,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });

      const result = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(false);
    });

    it('should prioritize panel invoice items over lab test invoice items', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });
      const { labRequest, labTestPanelRequest, labTests } = await createLabRequestWithPanel();

      // Panel item is NOT approved
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: labTestPanelRequest.id,
        sourceRecordType: 'LabTestPanelRequest',
        approved: false,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });

      // Lab test items ARE approved
      for (const labTest of labTests) {
        await models.InvoiceItem.create({
          invoiceId: testInvoice.id,
          sourceRecordId: labTest.id,
          sourceRecordType: 'LabTest',
          approved: true,
          orderDate: new Date().toISOString(),
          quantity: 1,
          orderedByUserId: app.user.id,
        });
      }

      const result = await app.get(`/api/labRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(lr => lr.id === labRequest.id);
      expect(found).toBeDefined();
      // Should be false because panel items take precedence
      expect(found.approved).toBe(false);
    });

    it('should sort by approved column', async () => {
      await models.LabRequest.truncate({ cascade: true, force: true });

      // Create requests with different approval statuses
      const { labRequest: lrApproved, labTestPanelRequest: panelApproved } =
        await createLabRequestWithPanel();
      const { labRequest: lrUnapproved, labTestPanelRequest: panelUnapproved } = await createLabRequestWithPanel();
      const { labRequest: lrNoItems } = await createLabRequestWithPanel();

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: panelApproved.id,
        sourceRecordType: 'LabTestPanelRequest',
        approved: true,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: panelUnapproved.id,
        sourceRecordType: 'LabTestPanelRequest',
        approved: false,
        orderDate: new Date().toISOString(),
        quantity: 1,
        orderedByUserId: app.user.id,
      });

      // Sort ASC - false first, then true, then nulls last
      const resultAsc = await app.get(
        `/api/labRequest?facilityId=${facilityId}&orderBy=approved&order=ASC`,
      );
      expect(resultAsc).toHaveSucceeded();
      expect(resultAsc.body.data[0].id).toBe(lrUnapproved.id);
      expect(resultAsc.body.data[0].approved).toBe(false);
      expect(resultAsc.body.data[1].id).toBe(lrApproved.id);
      expect(resultAsc.body.data[1].approved).toBe(true);
      expect(resultAsc.body.data[2].id).toBe(lrNoItems.id);
      expect(resultAsc.body.data[2].approved).not.toBeDefined();

      // Sort DESC - true first, then false, then nulls last
      const resultDesc = await app.get(
        `/api/labRequest?facilityId=${facilityId}&orderBy=approved&order=DESC`,
      );
      expect(resultDesc).toHaveSucceeded();
      expect(resultDesc.body.data[0].id).toBe(lrApproved.id);
      expect(resultDesc.body.data[0].approved).toBe(true);
      expect(resultDesc.body.data[1].id).toBe(lrUnapproved.id);
      expect(resultDesc.body.data[1].approved).toBe(false);
      expect(resultDesc.body.data[2].id).toBe(lrNoItems.id);
      expect(resultDesc.body.data[2].approved).not.toBeDefined();
    });
  });

  describe('Lab request table endpoint', () => {
    describe('Filtering by allFacilities', () => {
      // These are the only statuses returned by the listing endpoint
      // when no specific argument is included.
      const VALID_LISTING_LAB_REQUEST_STATUSES = [
        LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        LAB_REQUEST_STATUSES.INTERIM_RESULTS,
        LAB_REQUEST_STATUSES.RESULTS_PENDING,
        LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
        LAB_REQUEST_STATUSES.VERIFIED,
        LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
      ];
      const [facilityId] = selectFacilityIds(config);
      const otherFacilityId = 'kerang';
      const makeRequestAtFacility = async facilityId => {
        const location = await models.Location.create({
          ...fake(models.Location),
          facilityId,
        });
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          locationId: location.id,
          patientId,
        });
        await models.LabRequest.create({
          ...fake(models.LabRequest),
          encounterId: encounter.id,
          requestedById: app.user.id,
          status: chance.pickone(VALID_LISTING_LAB_REQUEST_STATUSES),
        });
      };

      beforeAll(async () => {
        // Because of the high number of lab requests
        // the endpoint pagination doesn't return the expected results.
        await models.LabRequest.truncate({ cascade: true, force: true });

        await makeRequestAtFacility(facilityId);
        await makeRequestAtFacility(facilityId);
        await makeRequestAtFacility(facilityId);
        await makeRequestAtFacility(otherFacilityId);
        await makeRequestAtFacility(otherFacilityId);
        await makeRequestAtFacility(otherFacilityId);
      });

      it('should omit external requests when allFacilities is false', async () => {
        const result = await app.get(
          `/api/labRequest?allFacilities=false&facilityId=${facilityId}`,
        );
        expect(result).toHaveSucceeded();
        expect(result.body.count).toBe(3);
        result.body.data.forEach(lr => {
          expect(lr.facilityId).toBe(facilityId);
        });
      });

      it('should include all requests when allFacilities is true', async () => {
        const result = await app.get(`/api/labRequest?allFacilities=true`);
        expect(result).toHaveSucceeded();
        expect(result.body.count).toBe(6);
        const hasConfigFacility = result.body.data.some(lr => lr.facilityId === facilityId);
        expect(hasConfigFacility).toBe(true);

        const hasOtherFacility = result.body.data.some(lr => lr.facilityId === otherFacilityId);
        expect(hasOtherFacility).toBe(true);
      });
    });

    describe('Permissions', () => {
      let sensitiveLabRequestId;

      beforeAll(async () => {
        await models.LabRequest.truncate({ cascade: true, force: true });

        for (let i = 0; i < 3; i++) {
          await models.LabRequest.createWithTests(await randomLabRequest(models, { patientId }));
        }

        const labRequestData = await randomSensitiveLabRequest(models, {
          patientId,
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        });
        const sensitiveLabRequest = await models.LabRequest.createWithTests(labRequestData);
        sensitiveLabRequestId = sensitiveLabRequest.id;
      });

      it('should exclude sensitive lab requests', async () => {
        const result = await app.get('/api/labRequest?allFacilities=true');
        expect(result).toHaveSucceeded();
        expect(result.body.count).toBe(3);
        expect(result.body.data.length).toBe(3);
        const labIds = result.body.data.map(lab => lab.id);
        const hasSensitiveRequest = labIds.includes(sensitiveLabRequestId);
        expect(hasSensitiveRequest).toBe(false);
      });
    });
  });
});
async function createTestTypesForPanel(models, labTestPanel) {
  const labTestTypes = await createLabTestTypes(models);
  await Promise.all(
    labTestTypes.map(ltt =>
      models.LabTestPanelLabTestTypes.create({
        labTestPanelId: labTestPanel.id,
        labTestTypeId: ltt.id,
      }),
    ),
  );
  return labTestTypes;
}
