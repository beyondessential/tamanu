import { LAB_TEST_STATUSES, LAB_REQUEST_STATUSES } from 'shared/constants';
import { createDummyPatient, createDummyVisit, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

const randomLabTests = (models, labTestCategoryId, amount) =>
  models.LabTestType.findAll({
    where: {
      labTestCategoryId,
    },
    limit: amount,
  });

const randomLabRequest = async (models, overrides) => {
  const categoryId = await randomReferenceId(models, 'labTestCategory');
  const labTestTypeIds = await randomLabTests(models, categoryId, 2);
  return {
    categoryId,
    labTestTypeIds,
    ...overrides,
  };
};

describe('Labs', () => {
  let patientId = null;
  let app = null;
  beforeAll(async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    patientId = patient.id;
    app = await baseApp.asRole('practitioner');
  });

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

  xit("should not record a lab request with a test whose category does not match the request's category", async () => {
    const [categoryA, categoryB] = await models.ReferenceData.findAll({
      where: { type: 'labTestCategory' },
      order: models.ReferenceData.sequelize.random(),
      limit: 2,
    });
    const labTestTypeIdsA = await randomLabTests(models, categoryA.id, 2);
    const labTestTypeIdsB = await randomLabTests(models, categoryB.id, 2);

    const response = await app.post('/v1/labRequest').send({
      patientId,
      labTestTypeIds: [...labTestTypeIdsA, ...labTestTypeIdsB],
    });
    expect(response).toHaveRequestError();
  });

  it('should record a test result', async () => {
    const labRequest = await models.LabRequest.create(
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
    const labRequest = await models.LabRequest.create(
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
    const { id: requestId } = await models.LabRequest.create(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ status });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });

  it('should publish a lab request', async () => {
    const { id: requestId } = await models.LabRequest.create(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.PUBLISHED;
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ status });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });
});
