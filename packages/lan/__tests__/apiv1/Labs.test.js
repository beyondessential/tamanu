import {
  LAB_TEST_STATUSES,
  LAB_REQUEST_STATUSES,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
} from 'shared/constants';
import { createDummyPatient, randomLabRequest } from 'shared/demoData';

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
    const labRequest = await randomLabRequest(models, { patientId });
    const response = await app.post('/v1/labRequest').send(labRequest);
    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body.id);
    expect(createdRequest).toBeTruthy();
    expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    const createdTests = await models.LabTest.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdTests).toHaveLength(labRequest.labTestTypeIds.length);
    expect(createdTests.every(x => x.status === LAB_REQUEST_STATUSES.RECEPTION_PENDING));
  });

  it('should not record a lab request with an invalid testTypeId', async () => {
    const labTestTypeIds = ['invalid-test-type-id', 'another-invalid-test-type-id'];
    const response = await app.post('/v1/labRequest').send({
      patientId,
      labTestTypeIds,
    });
    expect(response).toHaveRequestError();

    const createdRequest = await models.LabRequest.findByPk(response.body.id);
    expect(createdRequest).toBeFalsy();
  });

  test.todo('should not record a lab request with zero tests');
  test.todo(
    "should not record a lab request with a test whose category does not match the request's category",
  );
  /*
  it("should not record a lab request with a test whose category does not match the request's category", async () => {
    const [categoryA, categoryB] = await models.ReferenceData.findAll({
      where: { type: 'labTestCategory' },
      order: models.ReferenceData.sequelize.random(),
      limit: 2,
    });
    const labTestTypeIdsA = await randomLabTests(categoryA.id, 2);
    const labTestTypeIdsB = await randomLabTests(categoryB.id, 2);

    const response = await app.post('/v1/labRequest').send({
      patientId,
      labTestTypeIds: [...labTestTypeIdsA, ...labTestTypeIdsB],
    });
    expect(response).toHaveRequestError();
  });
  */

  it('should record a test result', async () => {
    const labRequest = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const [labTest] = await labRequest.getTests();

    const result = '100';
    const response = await app.put(`/v1/labTest/${labTest.id}`).send({ result });
    expect(response).toHaveSucceeded();

    const labTestCheck = await models.LabTest.findByPk(labTest.id);
    expect(labTestCheck).toHaveProperty('result', result);
  });

  test.todo('should fail to record a number test result against a string test');
  test.todo('should fail to record a string test result against an number test');

  test.todo('should record multiple test results');

  it('should update the status of a lab test', async () => {
    const labRequest = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const [labTest] = await labRequest.getTests();
    const status = LAB_TEST_STATUSES.PUBLISHED;
    const response = await app.put(`/v1/labTest/${labTest.id}`).send({ status });
    expect(response).toHaveSucceeded();

    const labTestCheck = await models.LabTest.findByPk(labTest.id);
    expect(labTestCheck).toHaveProperty('status', status);
  });

  it('should update the status of a lab request', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const user = await app.get('/v1/user/me');
    const response = await app
      .put(`/v1/labRequest/${requestId}`)
      .send({ status, userId: user.body.id });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });

  it('should publish a lab request', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.PUBLISHED;
    const user = await app.get('/v1/user/me');
    const response = await app
      .put(`/v1/labRequest/${requestId}`)
      .send({ status, userId: user.body.id });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });

  describe('Options', () => {
    it('should fetch lab test type options', async () => {
      const response = await app.get(`/v1/labTest/options`);
      expect(response).toHaveSucceeded();

      expect(response.body.count).toBeGreaterThan(0);
      const { data } = response.body;

      // ensure it's an array
      expect(Array.isArray(data)).toBeTruthy();

      // check some fields exist on at least some objects
      expect(data.find(x => x.maleMin)).toBeDefined();
      expect(data.find(x => x.maleMax)).toBeDefined();
      expect(data.find(x => x.femaleMin)).toBeDefined();
      expect(data.find(x => x.femaleMax)).toBeDefined();
      expect(data.find(x => x.unit)).toBeDefined();

      // ensure there's at least one response with options
      // and that options is returned as an array, not a string
      const withOptions = data.filter(x => x.options);
      expect(withOptions.length).toBeGreaterThan(0);
      expect(withOptions.every(x => Array.isArray(x.options))).toEqual(true);
    });

    it("should fetch only lab test types with visibility status 'current'", async () => {
      const category = await models.ReferenceData.create({
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
        name: 'TestCategory1',
        code: 'test_category_1',
      });
      await models.LabTestType.create({
        labTestCategoryId: category.id,
        name: 'Historical Lab Test Type',
        code: 'historical_lab_test_type',
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });

      const response = await app.get(`/v1/labTest/options`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toBeGreaterThan(0);

      const { data } = response.body;
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.every(l => l.visibilityStatus === VISIBILITY_STATUSES.CURRENT)).toBeTruthy();
    });

    it('should fetch lab test categories', async () => {
      const response = await app.get(`/v1/labTest/categories`);
      expect(response).toHaveSucceeded();

      const { data } = response.body;
      expect(Array.isArray(data)).toBeTruthy();
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('code');
    });
  });
});
