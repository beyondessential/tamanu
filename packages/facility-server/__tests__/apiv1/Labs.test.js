import {
  LAB_REQUEST_STATUSES,
  LAB_TEST_TYPE_VISIBILITY_STATUSES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import config from 'config';
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

    const specimenType = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: 'specimenType',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const sampleDetails = {
      [labTestPanel.id]: {
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
