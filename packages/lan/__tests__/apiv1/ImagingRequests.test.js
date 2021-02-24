import {
  createDummyPatient,
  createDummyEncounter,
  randomReferenceId,
} from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('Imaging requests', () => {
  let patient = null;
  let encounter = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
  });

  it('should record an imaging request', async () => {
    const result = await app.post('/v1/imagingRequest').send({
      encounterId: encounter.id,
      imagingTypeId: await randomReferenceId(models, 'imagingType'),
      requestedById: app.user.id,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.requestedDate).toBeTruthy();
  });

  it('should require a valid status', async () => {
    const result = await app.post('/v1/imagingRequest').send({
      encounterId: encounter.id,
      status: 'invalid',
      requestedById: app.user.id,
    });
    expect(result).toHaveRequestError();
  });

  it('should require a valid status', async () => {
    const result = await app.post('/v1/imagingRequest').send({
      encounterId: encounter.id,
      status: 'invalid',
      requestedById: app.user.id,
    });
    expect(result).toHaveRequestError();
  });

  it('should get imaging requests for an encounter', async () => {
    const createdImagingRequest = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingTypeId: await randomReferenceId(models, 'imagingType'),
      requestedById: app.user.id,
    });
    const result = await app.get(`/v1/encounter/${encounter.id}/imagingRequests`);
    expect(result).toHaveSucceeded();

    const { body } = result;

    // ID, type, status, requestedBy, requestedDate

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('type', createdImagingRequest.type);
  });

  it('should get imaging request reference info when listing imaging requests', async () => {
    const createdImagingRequest = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingTypeId: await randomReferenceId(models, 'imagingType'),
      requestedById: app.user.id,
    });
    const result = await app.get(`/v1/encounter/${encounter.id}/imagingRequests`);
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.count).toBeGreaterThan(0);

    const record = body.data[0];
    expect(record).toHaveProperty('requestedBy.displayName');
    expect(record).toHaveProperty('imagingType.name');
  });
});
