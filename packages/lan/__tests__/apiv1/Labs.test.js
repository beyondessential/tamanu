import { LAB_TEST_STATUSES, LAB_REQUEST_STATUSES } from 'shared/constants';
import config from 'config';
import { createDummyPatient, createDummyEncounter, randomLabRequest } from 'shared/demoData';
import { fake, chance } from 'shared/test-helpers';
import { createTestContext } from '../utilities';

const VALID_LAB_REQUEST_STATUSES = [
  LAB_REQUEST_STATUSES.RECEPTION_PENDING,
  LAB_REQUEST_STATUSES.RESULTS_PENDING,
  LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
  LAB_REQUEST_STATUSES.VERIFIED,
  LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
  LAB_REQUEST_STATUSES.PUBLISHED,
];

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
    const response = await app.post('/v1/labRequest').send(labRequest);
    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest).toBeTruthy();
    expect(createdRequest.status).toEqual(LAB_REQUEST_STATUSES.RECEPTION_PENDING);

    const createdTests = await models.LabTest.findAll({
      where: { labRequestId: createdRequest.id },
    });
    expect(createdTests).toHaveLength(labRequest.labTestTypeIds.length);
    expect(createdTests.every(x => x.status === LAB_REQUEST_STATUSES.RECEPTION_PENDING));
  });

  it('should record a lab request with a note', async () => {
    const data = await randomLabRequest(models, {
      patientId,
    });
    const content = chance.string();

    const response = await app.post('/v1/labRequest').send({
      ...data,
      note: {
        date: chance.date(),
        content,
      }
    });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(response.body[0].id, {
      include: 'notePages'
    });
    expect(labRequest).toBeTruthy();

    expect(labRequest.notePages).toHaveLength(1);
    const note = await labRequest.notePages[0].getNoteItems();
    expect(note[0]).toHaveProperty('content', content);
  });

  it('should record a lab request with a Lab Test Panel', async () => {
    const LabTestPanel = await models.LabTestPanel.create({
      name: 'Demo test panel',
      code: 'demo-test-panel',
    });
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const labRequest = await randomLabRequest(models, {
      patientId,
      labTestPanelId: LabTestPanel.id,
    });
    const response = await app
      .post('/v1/labRequest')
      .send({ ...labRequest, encounterId: encounter.id });
    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
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

  describe('Filtering by allFacilities', () => {
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
        status: chance.pickone(VALID_LAB_REQUEST_STATUSES),
      });
    };

    beforeAll(async () => {
      await makeRequestAtFacility(config.serverFacilityId);
      await makeRequestAtFacility(config.serverFacilityId);
      await makeRequestAtFacility(config.serverFacilityId);
      await makeRequestAtFacility(otherFacilityId);
      await makeRequestAtFacility(otherFacilityId);
      await makeRequestAtFacility(otherFacilityId);
    });

    it('should omit external requests when allFacilities is false', async () => {
      const result = await app.get(`/v1/labRequest?allFacilities=false`);
      expect(result).toHaveSucceeded();
      result.body.data.forEach(lr => {
        expect(lr.facilityId).toBe(config.serverFacilityId);
      });
    });

    it('should include all requests when allFacilities  is true', async () => {
      const result = await app.get(`/v1/labRequest?allFacilities=true`);
      expect(result).toHaveSucceeded();

      const hasConfigFacility = result.body.data.some(
        lr => lr.facilityId === config.serverFacilityId,
      );
      expect(hasConfigFacility).toBe(true);

      const hasOtherFacility = result.body.data.some(lr => lr.facilityId === otherFacilityId);
      expect(hasOtherFacility).toBe(true);
    });
  });
});
