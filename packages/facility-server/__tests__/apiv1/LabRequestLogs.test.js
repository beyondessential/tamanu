import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { createDummyPatient, randomLabRequest } from '@tamanu/database/demoData';

import { createTestContext } from '../utilities';

describe('Lab request status history', () => {
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
    const response = await app.put(`/api/labRequest/${requestId}`).send({ status });
    expect(response).toHaveRequestError();

    // Errored request should not have updated status
    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);
  });

  it('should record a transition when updating a labs status', async () => {
    const user = await app.get('/api/user/me');
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const status = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
    const userId = user.body.id;
    const response = await app.put(`/api/labRequest/${requestId}`).send({ status, userId });
    expect(response).toHaveSucceeded();

    const labRequest = await models.LabRequest.findByPk(requestId);
    expect(labRequest).toHaveProperty('status', status);

    const history = await app.get(`/api/labRequestLog/labRequest/${requestId}`);
    expect(history).toHaveSucceeded();
    // the status it was created with, then the transition, most recent first
    expect(history.body.data).toEqual([
      expect.objectContaining({ status, updatedByDisplayName: user.body.displayName }),
      expect.objectContaining({ status: LAB_REQUEST_STATUSES.RECEPTION_PENDING }),
    ]);
  });

  it('should not record a transition when the status is unchanged', async () => {
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );
    const response = await app.put(`/api/labRequest/${requestId}`).send({ urgent: true });
    expect(response).toHaveSucceeded();

    const history = await app.get(`/api/labRequestLog/labRequest/${requestId}`);
    expect(history.body.data).toEqual([
      expect.objectContaining({ status: LAB_REQUEST_STATUSES.RECEPTION_PENDING }),
    ]);
  });

  it('reports the latest published transition, and nothing before one', async () => {
    const user = await app.get('/api/user/me');
    const { id: requestId } = await models.LabRequest.createWithTests(
      await randomLabRequest(models, { patientId }),
    );

    const before = await app.get(`/api/labRequestLog/labRequest/${requestId}/latest-published`);
    expect(before).toHaveSucceeded();
    // an empty body: the printout reads updatedBy off it and shows no publisher
    expect(before.body.updatedBy).toBeUndefined();

    await app
      .put(`/api/labRequest/${requestId}`)
      .send({ status: LAB_REQUEST_STATUSES.PUBLISHED, userId: user.body.id });

    const after = await app.get(`/api/labRequestLog/labRequest/${requestId}/latest-published`);
    expect(after.body).toMatchObject({
      status: LAB_REQUEST_STATUSES.PUBLISHED,
      updatedBy: { displayName: user.body.displayName },
    });
  });
});
