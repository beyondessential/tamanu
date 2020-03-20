import { createTestContext } from '../utilities';

import { LAB_TEST_STATUSES, LAB_REQUEST_STATUSES } from 'shared/constants';
import { createDummyPatient, createDummyVisit, randomReferenceId } from 'shared/demoData/patients';

const { baseApp, models } = createTestContext();

const randomLabTests = (models, labTestCategoryId, amount) => {
  return models.LabTestType.findAll({
    where: {
      labTestCategoryId,
    },
    limit: amount,
  });
};

describe('Labs', () => {
  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
  });

  it('should record a lab request', async () => {
    const categoryId = await randomReferenceId(models, 'labTestCategory');
    const labTestTypeIds = await randomLabTests(models, categoryId, 2);
    const response = await app.post('/v1/labRequest').send({
      patientId: patient.id,
      categoryId,
      labTestTypeIds,
      labTestType: '',
    });
    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body.id);
    expect(createdRequest).toBeTruthy();
    expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.RECEPTION_PENDING);
    
    const createdTests = await models.LabTest.findAll({ where: { labRequestId: createdRequest.id } });
    expect(createdTests).toHaveLength(labTestTypeIds.length);
    expect(createdTests.every(x => x.status === LAB_REQUEST_STATUSES.RECEPTION_PENDING));
  });

  it('should not record a lab request with an invalid testTypeId', async () => {
    const labTestTypeIds = [
      'invalid-test-type-id',
      'another-invalid-test-type-id',
    ];
    const response = await app.post('/v1/labRequest').send({
      patientId: patient.id,
      labTestTypeIds,
    });
    expect(response).toHaveRequestError();

    const createdRequest = await models.LabRequest.findByPk(response.body.id);
    expect(createdRequest).toBeFalsy();
  });

  xit('should record a test result', async () => {
    const result = 100;
    const testId = '123';
    const response = await app.put(`/v1/labTest/${testId}`).send({ result });
    expect(response).toHaveSucceeded();

    const labTest = await models.LabTest.findByPk(testId);
    expect(labTest).toHaveProperty('result', result);
  });

  test.todo('should record multiple test results');
  
  xit('should update the status of a lab test', async () => {
    const status = LAB_TEST_STATUSES.PUBLISHED;
    const testId = '123';
    const response = await app.put(`/v1/labTest/${testId}`).send({ status });
    expect(response).toHaveSucceeded();

    const labTest = await models.LabTest.findByPk(testId);
    expect(labTest).toHaveProperty('result', result);
  });

  xit('should update the status of a lab request', async () => {
    const requestId = '123';
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ status });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });

  xit('should publish a lab request', async () => {
    const requestId = '123';
    const status = LAB_REQUEST_STATUSES.PUBLISHED;
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ status });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);
  });

});
