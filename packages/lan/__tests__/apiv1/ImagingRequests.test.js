import config from 'config';
import { IMAGING_TYPES, NOTE_RECORD_TYPES, NOTE_TYPES, VISIBILITY_STATUSES, REFERENCE_TYPES } from 'shared/constants';
import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { fake } from 'shared/test-helpers/fake';

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

  it('should return note content when providing note or areaNote', async () => {
    const result = await app.post('/v1/imagingRequest').send({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
      note: 'test-note',
      areaNote: 'test-area-note',
    });
    expect(result).toHaveSucceeded();
    expect(result.body.note).toEqual('test-note');
    expect(result.body.areaNote).toEqual('test-area-note');
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

    // ID, imagingType, status, requestedBy, requestedDate

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('imagingType', createdImagingRequest.imagingType);
  });

  it('should get relevant notes for an imagingRequest', async () => {
    const createdImagingRequest = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });

    await models.NotePage.createForRecord(
      createdImagingRequest.id,
      NOTE_RECORD_TYPES.IMAGING_REQUEST,
      NOTE_TYPES.AREA_TO_BE_IMAGED,
      'test-area-note',
      app.user.id,
    );

    await models.NotePage.createForRecord(
      createdImagingRequest.id,
      NOTE_RECORD_TYPES.IMAGING_REQUEST,
      NOTE_TYPES.OTHER,
      'test-note',
      app.user.id,
    );

    const result = await app.get(`/v1/imagingRequest/${createdImagingRequest.id}`);

    expect(result).toHaveSucceeded();

    const { body } = result;
    expect(body).toHaveProperty('note', 'test-note');
    expect(body).toHaveProperty('areaNote', 'test-area-note');
  });

  it('should get relevant notes for an imagingRequest under an encounter', async () => {
    // Arrange
    const createdImagingRequest = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });
    const n1 = await models.NotePage.createForRecord(
      createdImagingRequest.id,
      NOTE_RECORD_TYPES.IMAGING_REQUEST,
      NOTE_TYPES.AREA_TO_BE_IMAGED,
      'test-area-note',
      app.user.id,
    );
    const n2 = await models.NotePage.createForRecord(
      createdImagingRequest.id,
      NOTE_RECORD_TYPES.IMAGING_REQUEST,
      NOTE_TYPES.OTHER,
      'test-note',
      app.user.id,
    );

    // Act
    const result = await app.get(
      `/v1/encounter/${encounter.id}/imagingRequests?includeNotePages=true`,
    );

    // Assert
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.count).toBeGreaterThan(0);
    const retrievedImgReq = body.data.find(ir => ir.id === createdImagingRequest.id);
    expect(retrievedImgReq).toMatchObject({
      note: 'test-note',
      areaNote: 'test-area-note',
    });
    expect(
      retrievedImgReq.notePages
        .map(np => np.id)
        .sort()
        .join(','),
    ).toBe([n1.id, n2.id].sort().join(','));
  });

  it('should get imaging request reference info when listing imaging requests', async () => {
    await models.ImagingRequest.create({
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

  describe('Area listing', () => {

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

    it('should respect visibilityStatus', async () => {
      const hiddenArea = await models.ReferenceData.create(fake(models.ReferenceData, {
        type: REFERENCE_TYPES.X_RAY_IMAGING_AREA,
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      }));
      
      const result = await app.get('/v1/imagingRequest/areas');
      expect(result).toHaveSucceeded();
      const { body } = result;

      expect(body.xRay).not.toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: hiddenArea.id,
        })
      ]));
    });

  });

  it('should return all results for an imaging request', async () => {
    // arrange
    const ir = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });
    await models.ImagingResult.create({
      imagingRequestId: ir.id,
      description: 'result description',
    });
    await models.ImagingResult.create({
      imagingRequestId: ir.id,
      description: 'result description with user',
      completedById: app.user.dataValues.id,
    });

    // act
    const result = await app.get(`/v1/imagingRequest/${ir.id}`);

    // assert
    expect(result).toHaveSucceeded();
    expect(result.body.results[0]).toMatchObject({
      description: 'result description',
    });
    expect(result.body.results[1]).toMatchObject({
      description: 'result description with user',
      completedBy: {
        id: app.user.dataValues.id,
      },
    });
  });

  it('should create a result for an imaging request', async () => {
    // arrange
    const ir = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });

    // act
    const result = await app.put(`/v1/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        description: 'new result description',
        completedAt: getCurrentDateTimeString(),
        completedById: app.user.dataValues.id,
      },
    });

    // assert
    expect(result).toHaveSucceeded();

    const results = await models.ImagingResult.findAll({
      where: { imagingRequestId: ir.id },
    });
    expect(results.length).toBe(1);
    expect(results[0].description).toBe('new result description');
  });

  it('should create multiple results for an imaging request', async () => {
    // arrange
    const ir = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });

    // act
    const result1 = await app.put(`/v1/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        description: 'new result description 1',
        completedAt: getCurrentDateTimeString(),
        completedById: app.user.dataValues.id,
      },
    });
    const result2 = await app.put(`/v1/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        description: 'new result description 2',
        completedAt: getCurrentDateTimeString(),
        completedById: app.user.dataValues.id,
      },
    });

    // assert
    expect(result1).toHaveSucceeded();
    expect(result2).toHaveSucceeded();

    const results = await models.ImagingResult.findAll({
      where: { imagingRequestId: ir.id },
    });
    expect(results.length).toBe(2);
    expect(results[0].description).toBe('new result description 1');
    expect(results[1].description).toBe('new result description 2');
  });

  it('should create imaging result with description as optional', async () => {
    // arrange
    const ir = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });

    const newResultDate = getCurrentDateTimeString();
    // act
    const result1 = await app.put(`/v1/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        completedAt: newResultDate,
        completedById: app.user.dataValues.id,
      },
    });

    // assert
    expect(result1).toHaveSucceeded();

    const results = await models.ImagingResult.findAll({
      where: { imagingRequestId: ir.id },
    });
    expect(results.length).toBe(1);
    expect(results[0].completedById).toBe(app.user.dataValues.id);
    expect(results[0].completedAt).toBe(newResultDate);
  });

  it('should query an external provider for imaging results if configured so', async () => {
    // arrange
    const ir = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });
    const resultRow = await models.ImagingResult.create({
      imagingRequestId: ir.id,
      description: 'external result description',
      externalCode: 'EXT123',
    });
    await models.ImagingResult.create({
      imagingRequestId: ir.id,
      description: 'result description with user',
      completedById: app.user.dataValues.id,
    });

    const settings = await models.Setting.get('integrations.imaging');
    await models.Setting.set('integrations.imaging', {
      enabled: true,
      provider: 'test',
    });

    // act
    const result = await app.get(`/v1/imagingRequest/${ir.id}`);

    // reset settings
    await models.Setting.set('integrations.imaging', settings);

    // assert
    expect(result).toHaveSucceeded();
    expect(result.body.results[0]).toMatchObject({
      description: 'external result description',
      externalUrl: `https://test.tamanu.io/${resultRow.id}`,
    });
    expect(result.body.results[1]).toMatchObject({
      description: 'result description with user',
      completedBy: {
        id: app.user.dataValues.id,
      },
    });
  });

  describe('Filtering by allFacilities', () => {
    const otherFacilityId = 'kerang';
    const makeRequestAtFacility = async facilityId => {
      const testLocation = await models.Location.create({
        ...fake(models.Location),
        facilityId,
      });
      const testEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: testLocation.id,
        patientId: patient.id,
      });
      await models.ImagingRequest.create({
        encounterId: testEncounter.id,
        imagingType: IMAGING_TYPES.CT_SCAN,
        requestedById: app.user.id,
      });
    };

    beforeAll(async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      await makeRequestAtFacility(config.serverFacilityId);
      await makeRequestAtFacility(config.serverFacilityId);
      await makeRequestAtFacility(config.serverFacilityId);
      await makeRequestAtFacility(otherFacilityId);
      await makeRequestAtFacility(otherFacilityId);
      await makeRequestAtFacility(otherFacilityId);
    });

    it('should omit external requests when allFacilities is false', async () => {
      const result = await app.get(`/v1/imagingRequest?allFacilities=false`);
      expect(result).toHaveSucceeded();
      result.body.data.forEach(ir => {
        expect(ir.encounter.location.facilityId).toBe(config.serverFacilityId);
      });
    });

    it('should include all requests when allFacilities is true', async () => {
      const result = await app.get(`/v1/imagingRequest?allFacilities=true`);
      expect(result).toHaveSucceeded();

      const hasConfigFacility = result.body.data.some(
        ir => ir.encounter.location.facilityId === config.serverFacilityId,
      );
      expect(hasConfigFacility).toBe(true);

      const hasOtherFacility = result.body.data.some(
        ir => ir.encounter.location.facilityId === otherFacilityId,
      );
      expect(hasOtherFacility).toBe(true);
    });
  });
});
