import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { createDummyPatient, randomLabRequest } from '@tamanu/shared/demoData';

import { createTestContext } from '../utilities';

describe('Lab request logs', () => {
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

  it('should throw an error if no userId is provided when updating a lab request', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const response = await app.put(`/v1/labRequest/${requestId}`).send({ status });
    expect(response).toHaveRequestError();

    // Errored request should not have updated status
    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);
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
    // It should have two logs, one for when the lab request is created and another when the lab request is updated
    expect(labRequestLog.length).toEqual(2);
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

    // It should have one log created for when the lab request is created only
    expect(labRequestLog.length).toEqual(1);
  });
});
