import { LAB_REQUEST_STATUSES } from 'shared/constants';
import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const randomLabTests = (models, labTestCategoryId, amount) =>
  models.LabTestType.findAll({
    where: {
      labTestCategoryId,
    },
    limit: amount,
  });

const randomLabRequest = async (models, overrides) => {
  const categoryId = await randomReferenceId(models, 'labTestCategory');
  const labTestTypeIds = (await randomLabTests(models, categoryId, 2)).map(({ id }) => id);
  return {
    categoryId,
    labTestTypeIds,
    displayId: 'TESTID',
    ...overrides,
  };
};

describe('Lab request logs', () => {
  let patientId = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    const patient = await models.Patient.create(await createDummyPatient(models));
    patientId = patient.id;
    app = await baseApp.asRole('practitioner');
  });

  it.only('should create a lab request log when updating a labs status', async () => {
    const user = await baseApp.get('/v1/user/me');
    const labRequest = await randomLabRequest(models, { patientId });
    const response = await app.post('/v1/labRequest').send(labRequest);
    const updatedRequest = await app.put(`labRequest/${response.body.id}`, {
      status: LAB_REQUEST_STATUSES.PUBLISHED,
      userId: user.id,
    });
    expect(updatedRequest).toBeTruthy();
    expect(updatedRequest.body.createdAt).toBeTruthy();
    expect(updatedRequest.body.status).toEqual(LAB_REQUEST_STATUSES.PUBLISHED);
  });
});
