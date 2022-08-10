import { IMAGING_TYPES } from 'shared/constants';
import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('Imaging requests', () => {
  let patient = null;
  let encounter = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
  });
  afterAll(() => ctx.close());

  it('should record an imaging request', async () => {
    const result = await app.post('/v1/imagingRequest').send({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.requestedDate).toBeTruthy();
  });

  it('should require a valid status', async () => {
    const result = await app.post('/v1/imagingRequest').send({
      encounterId: encounter.id,
      status: 'invalid',
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });
    expect(result).toHaveRequestError();
  });

  it('should require a valid status', async () => {
    const result = await app.post('/v1/imagingRequest').send({
      encounterId: encounter.id,
      status: 'invalid',
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });
    expect(result).toHaveRequestError();
  });

  it('should get imaging requests for an encounter', async () => {
    const createdImagingRequest = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
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
      requestedById: app.user.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
    });
    const result = await app.get(`/v1/encounter/${encounter.id}/imagingRequests`);
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.count).toBeGreaterThan(0);

    const record = body.data[0];
    expect(record).toHaveProperty('requestedBy.displayName');
  });

  it('should return areas to be imaged', async () => {
    const result = await app.get('/v1/imagingRequest/areas');
    expect(result).toHaveSucceeded();
    const { body } = result;
    const expectedAreas = expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
      }),
    ]);
    expect(body).toEqual(
      expect.objectContaining({
        xRay: expectedAreas,
        ctScan: expectedAreas,
        ultrasound: expectedAreas,
      }),
    );
  });
});
