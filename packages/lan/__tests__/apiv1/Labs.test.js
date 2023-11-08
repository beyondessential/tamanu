import { LAB_REQUEST_STATUSES, LAB_TEST_TYPE_VISIBILITY_STATUSES } from '@tamanu/constants';
import config from 'config';
import {
  createDummyPatient,
  createDummyEncounter,
  randomLabRequest,
} from '@tamanu/shared/demoData';
import { fake, chance } from '@tamanu/shared/test-helpers';
import { createLabTestTypes } from '@tamanu/shared/demoData/labRequests';
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
    const response = await app.post('/v1/labRequest').send(labRequest);
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

    const response = await app.post('/v1/labRequest').send({
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
    const response = await app.post('/v1/labRequest').send({
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

    const response = await app.post('/v1/labRequest').send({
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

    const response = await app.post('/v1/labRequest').send({
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
      .post('/v1/labRequest')
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

  it('should record samples for panels', async () => {
    const labTestPanel = await models.LabTestPanel.create({
      name: 'Demo test panel',
      code: 'demo-test-panel',
    });
    const labTestTypes = await createTestTypesForPanel(models, labTestPanel);

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId,
    });

    const sampleTime = '2023-06-09 00:00:00';
    const sampleDetails = {
      [labTestPanel.id]: {
        sampleTime,
      },
    };
    const response = await app.post('/v1/labRequest').send({
      panelIds: [labTestPanel.id],
      encounterId: encounter.id,
      sampleDetails,
    });
    expect(response).toHaveSucceeded();

    const createdRequest = await models.LabRequest.findByPk(response.body[0].id);
    expect(createdRequest).toBeTruthy();
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

    const result = await app.get('/v1/labTestType');
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.length).toBe(3);
    body.forEach(labTestType => {
      expect(labTestType.visibilityStatus).toBe(LAB_TEST_TYPE_VISIBILITY_STATUSES.CURRENT);
    });
  });

  it('should only retrieve panels with a visibilityStatus status of current', async () => {
    await models.LabTestPanel.create({
      name: 'Historical test panel',
      code: 'historical-test-panel',
      visibilityStatus: 'historical',
    });
    const result = await app.get('/v1/labTestPanel');
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

    describe('PUT', () => {
      test.todo('should fail to record a number test result against a string test');
      test.todo('should fail to record a string test result against an number test');

      it('should only update tests with changes', async () => {
        const [test1, test2] = await labRequest.getTests();
        const mockResult = 'Mock result';
        const mockVerification = 'verified';
        const response = await app.put(`/v1/labRequest/${labRequest.id}/tests`).send({
          [test1.id]: {
            result: mockResult,
            verification: mockVerification,
          },
          [test2.id]: {
            result: test2.result,
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
        const response = await app.put(`/v1/labRequest/${labRequest.id}/tests`).send({
          [test1.id]: {
            result: mockResult,
            verification: mockVerification,
          },
          [test2.id]: {
            result: mockResult2,
            verification: mockVerification2,
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
        const response = await app.put(`/v1/labRequest/${labRequest.id}/tests`).send({
          [test1.id]: {
            result: mockResult,
            verification: mockVerification,
          },
          invalidTestId: {
            result: mockResult,
            verification: mockVerification,
          },
        });
        expect(response).toHaveRequestError(404);
      });
    });
  });

  describe('Filtering by allFacilities', () => {
    // These are the only statuses returned by the listing endpoint
    // when no specific argument is included.
    const VALID_LISTING_LAB_REQUEST_STATUSES = [
      LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      LAB_REQUEST_STATUSES.RESULTS_PENDING,
      LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
      LAB_REQUEST_STATUSES.VERIFIED,
      LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    ];
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
