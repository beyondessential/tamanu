import {
  LAB_TEST_STATUSES,
  LAB_REQUEST_STATUSES,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
} from 'shared/constants';
import config from 'config';
import { createDummyPatient, createDummyEncounter, randomLabRequest } from 'shared/demoData';

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

  it('should return with only lab requests from config facility with allFacilities filter turned off', async () => {
    // arrange
    const thisFacilityLocation = await models.Location.create({
      facilityId: config.serverFacilityId,
      name: 'This Facility Location',
      code: 'thisFacilityLocation',
    });
    const thisFacilityEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      locationId: thisFacilityLocation.id,
      patientId,
    });
    await models.LabRequest.create({
      encounterId: thisFacilityEncounter.id,
      requestedById: app.user.id,
      displayId: '12345',
    });

    const result = await app.get(`/v1/labRequest?allFacilities=true`);
    expect(result).toHaveSucceeded();

    const result2 = await app.get(`/v1/labRequest?allFacilities=false`);
    result2.body.data.forEach(lr => {
      expect(lr.facilityId).toBe(config.serverFacilityId);
    });
  });
});
