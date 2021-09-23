import { LAB_REQUEST_STATUSES } from 'shared/constants';
import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { fake } from 'shared/test-helpers/fake';

import { createTestContext } from '../utilities';

const randomLabRequest = async (models, overrides) => {
  const { LabTestType } = models;
  const labTestTypes = Array(2).map(() => fake(LabTestType));
  await Promise.all(labTestTypes.map(t => LabTestType.create(t)));
  const categoryId = await randomReferenceId(models, 'labTestCategory');

  return {
    categoryId,
    labTestTypeIds: labTestTypes.map(t => t.id),
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

  it('should throw an error if no userId is provided when updating a lab request', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ status });
    expect(response).toHaveRequestError();
  });

  it('should create a lab request log when updating a labs status', async () => {
    const user = await app.get('/v1/user/me');
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const userId = user.body.id;
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ status, userId });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);

    expect(labRequest).toHaveProperty('status', status);
    expect(labRequest).toBeTruthy();
    expect(labRequest.createdAt).toBeTruthy();

    const labRequestLog = await models.LabRequestLog.findAll({
      where: {
        labRequestId: labRequest.id,
      },
    });
    expect(labRequestLog.length).toEqual(1);
  });

  it('should not create a lab request log if not updating the lab request status', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ urgent: true });
    expect(response).toHaveSucceeded();

    const labRequestLog = await models.LabRequestLog.findAll({
      where: {
        labRequestId: response.body.id,
      },
    });
    expect(labRequestLog.length).toEqual(0);
  });
});
