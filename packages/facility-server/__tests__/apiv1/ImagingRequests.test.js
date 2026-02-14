import { afterAll, beforeAll } from '@jest/globals';
import config from 'config';

import {
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES,
  INVOICE_STATUSES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  REFERENCE_TYPES,
  SETTINGS_SCOPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../utilities';

describe('Imaging requests', () => {
  const [facilityId] = selectFacilityIds(config);
  let patient = null;
  let encounter = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let user = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    user = await models.User.create({
      ...fakeUser(),
      role: 'practitioner',
    });
    app = await baseApp.asUser(user);
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
  });
  afterAll(() => ctx.close());

  describe('Creating an imaging request', () => {
    it('should record an imaging request', async () => {
      const result = await app.post('/api/imagingRequest').send({
        encounterId: encounter.id,
        imagingType: IMAGING_TYPES.CT_SCAN,
        requestedById: app.user.id,
      });
      expect(result).toHaveSucceeded();
      expect(result.body.requestedDate).toBeTruthy();
    });

    it('should require a valid status', async () => {
      const result = await app.post('/api/imagingRequest').send({
        encounterId: encounter.id,
        status: 'invalid',
        imagingType: IMAGING_TYPES.CT_SCAN,
        requestedById: app.user.id,
      });
      expect(result).toHaveRequestError();
    });

    it('should require a valid status', async () => {
      const result = await app.post('/api/imagingRequest').send({
        encounterId: encounter.id,
        status: 'invalid',
        imagingType: IMAGING_TYPES.CT_SCAN,
        requestedById: app.user.id,
      });
      expect(result).toHaveRequestError();
    });
  });

  it('should get imaging requests for an encounter', async () => {
    const createdImagingRequest = await models.ImagingRequest.create({
      encounterId: encounter.id,
      imagingType: IMAGING_TYPES.CT_SCAN,
      requestedById: app.user.id,
    });
    const result = await app.get(`/api/encounter/${encounter.id}/imagingRequests`);
    expect(result).toHaveSucceeded();

    const { body } = result;

    // ID, imagingType, status, requestedBy, requestedDate

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('imagingType', createdImagingRequest.imagingType);
  });

  describe('Notes', () => {
    it('should get relevant notes for an imagingRequest', async () => {
      const createdImagingRequest = await models.ImagingRequest.create({
        encounterId: encounter.id,
        imagingType: IMAGING_TYPES.CT_SCAN,
        requestedById: app.user.id,
      });

      await models.Note.createForRecord(
        createdImagingRequest.id,
        NOTE_RECORD_TYPES.IMAGING_REQUEST,
        NOTE_TYPES.AREA_TO_BE_IMAGED,
        'test-area-note',
        app.user.id,
      );

      await models.Note.createForRecord(
        createdImagingRequest.id,
        NOTE_RECORD_TYPES.IMAGING_REQUEST,
        NOTE_TYPES.OTHER,
        'test-note',
        app.user.id,
      );

      const result = await app.get(`/api/imagingRequest/${createdImagingRequest.id}`);

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
      const n1 = await models.Note.createForRecord(
        createdImagingRequest.id,
        NOTE_RECORD_TYPES.IMAGING_REQUEST,
        NOTE_TYPES.AREA_TO_BE_IMAGED,
        'test-area-note',
        app.user.id,
      );
      const n2 = await models.Note.createForRecord(
        createdImagingRequest.id,
        NOTE_RECORD_TYPES.IMAGING_REQUEST,
        NOTE_TYPES.OTHER,
        'test-note',
        app.user.id,
      );

      // Act
      const result = await app.get(
        `/api/encounter/${encounter.id}/imagingRequests?includeNotes=true`,
      );

      // Assert
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.count).toBeGreaterThan(0);
      const retrievedImgReq = body.data.find((ir) => ir.id === createdImagingRequest.id);
      expect(retrievedImgReq).toMatchObject({
        note: 'test-note',
        areaNote: 'test-area-note',
      });
      expect(
        retrievedImgReq.notes
          .map((note) => note.id)
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
      const result = await app.get(`/api/encounter/${encounter.id}/imagingRequests`);
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.count).toBeGreaterThan(0);

      const record = body.data[0];
      expect(record).toHaveProperty('requestedBy.displayName');
    });

    it('should return note content when providing note or areaNote', async () => {
      const result = await app.post('/api/imagingRequest').send({
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
  });

  describe('Area listing', () => {
    it('should return areas to be imaged', async () => {
      const result = await app.get('/api/imagingRequest/areas');
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
      const hiddenArea = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.X_RAY_IMAGING_AREA,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );

      const result = await app.get('/api/imagingRequest/areas');
      expect(result).toHaveSucceeded();
      const { body } = result;

      expect(body.xRay).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: hiddenArea.id,
          }),
        ]),
      );
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
    const result = await app.get(`/api/imagingRequest/${ir.id}`).query({ facilityId });

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
    const result = await app.put(`/api/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        description: 'new result description',
        completedAt: getCurrentDateTimeString(),
        completedById: app.user.dataValues.id,
      },
      facilityId,
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
    const result1 = await app.put(`/api/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        description: 'new result description 1',
        completedAt: getCurrentDateTimeString(),
        completedById: app.user.dataValues.id,
      },
      facilityId,
    });
    const result2 = await app.put(`/api/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        description: 'new result description 2',
        completedAt: getCurrentDateTimeString(),
        completedById: app.user.dataValues.id,
      },
      facilityId,
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
    const result1 = await app.put(`/api/imagingRequest/${ir.id}`).send({
      status: 'completed',
      newResult: {
        completedAt: newResultDate,
        completedById: app.user.dataValues.id,
      },
      facilityId,
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
    await models.Setting.set(
      'integrations.imaging',
      {
        enabled: true,
        provider: 'test',
      },
      SETTINGS_SCOPES.GLOBAL,
    );

    // act
    const result = await app.get(`/api/imagingRequest/${ir.id}`).query({ facilityId });

    // reset settings
    await models.Setting.set('integrations.imaging', settings, SETTINGS_SCOPES.GLOBAL);

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

  describe('Listing requests', () => {
    const [facilityId] = selectFacilityIds(config);

    const makeRequestAtFacility = async (facilityId, status, resultCount = 0) => {
      const testLocation = await models.Location.create({
        ...fake(models.Location),
        facilityId,
      });
      const testEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: testLocation.id,
        patientId: patient.id,
      });
      const imagingRequest = await models.ImagingRequest.create({
        encounterId: testEncounter.id,
        imagingType: IMAGING_TYPES.CT_SCAN,
        status,
        requestedById: app.user.id,
      });

      for (let i = 0; i < resultCount; ++i) {
        // add a result
        // (note that `fake` will automatically assign a completedAt)
        await models.ImagingResult.create(
          fake(models.ImagingResult, {
            imagingRequestId: imagingRequest.id,
          }),
        );
      }

      return imagingRequest;
    };

    describe('Filtering by allFacilities', () => {
      const otherFacilityId = 'kerang';

      beforeAll(async () => {
        await models.ImagingRequest.truncate({ cascade: true });
        await makeRequestAtFacility(facilityId);
        await makeRequestAtFacility(facilityId);
        await makeRequestAtFacility(facilityId, IMAGING_REQUEST_STATUS_TYPES.COMPLETED);
        await makeRequestAtFacility(otherFacilityId);
        await makeRequestAtFacility(otherFacilityId);
        await makeRequestAtFacility(otherFacilityId, IMAGING_REQUEST_STATUS_TYPES.COMPLETED);
      });

      it('should omit external requests when allFacilities is false', async () => {
        const result = await app.get(`/api/imagingRequest?allFacilities=false`);
        expect(result).toHaveSucceeded();
        result.body.data.forEach((ir) => {
          expect(ir.encounter.location.facilityId).toBe(facilityId);
        });
      });

      it('should include all requests when allFacilities is true', async () => {
        const result = await app.get(`/api/imagingRequest?allFacilities=true`);
        expect(result).toHaveSucceeded();

        const hasConfigFacility = result.body.data.some(
          (ir) => ir.encounter.location.facilityId === facilityId,
        );
        expect(hasConfigFacility).toBe(true);

        const hasOtherFacility = result.body.data.some(
          (ir) => ir.encounter.location.facilityId === otherFacilityId,
        );
        expect(hasOtherFacility).toBe(true);
      });

      it('Completed tab should only show completed imaging requests', async () => {
        const result = await app.get(
          `/api/imagingRequest?status=${IMAGING_REQUEST_STATUS_TYPES.COMPLETED}`,
        );
        expect(result).toHaveSucceeded();
        result.body.data.forEach((ir) => {
          expect(ir.status).toBe(IMAGING_REQUEST_STATUS_TYPES.COMPLETED);
        });
      });
    });

    describe('Pagination', () => {
      // create a bunch of tests, use a number that isn't divisible by 10 to
      // stress the pagination a bit harder
      const completedCount = 17;
      const incompleteCount = 9;
      const totalCount = completedCount + incompleteCount;

      beforeAll(async () => {
        await models.ImagingRequest.truncate({ cascade: true });

        for (let i = 0; i < completedCount; ++i) {
          // Some tests expect that the imaging results completedAt field
          // is not duplicated, otherwise we cannot guarantee ordering.
          // Given this field is a date time string, the precision is up to seconds
          // which means we need to wait for one whole second between requests
          await sleepAsync(1000);
          const resultCount = i % 4; // get a few different result counts in, including 0
          await makeRequestAtFacility(
            facilityId,
            IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
            resultCount,
          );
        }
        for (let i = 0; i < incompleteCount; ++i) {
          await makeRequestAtFacility(facilityId);
        }
      });

      it('Should paginate correctly', async () => {
        const getPage = async (page) => {
          const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}&page=${page}`);
          expect(result).toHaveSucceeded();
          return result;
        };

        const result = await getPage(0);
        expect(result.body.count).toBe(totalCount); // total requests
        expect(result.body.data).toHaveLength(10); // page

        const result2 = await getPage(1);
        expect(result2.body.count).toBe(totalCount); // total requests
        expect(result2.body.data).toHaveLength(10); // page

        const ids = new Set([
          ...result.body.data.map((x) => x.id),
          ...result2.body.data.map((x) => x.id),
        ]);
        expect(ids.size).toBe(20); // ie no duplicates in the two result sets
      });

      it('Should paginate correctly when sorting by completedAt', async () => {
        const getPage = async (page) => {
          const result = await app.get(
            `/api/imagingRequest?facilityId=${facilityId}&orderBy=completedAt&page=${page}&order=DESC`,
          );
          expect(result).toHaveSucceeded();
          return result;
        };

        const result = await getPage(0);
        expect(result.body.count).toBe(totalCount); // total requests
        expect(result.body.data).toHaveLength(10); // page

        const result2 = await getPage(1);
        expect(result2.body.count).toBe(totalCount); // total requests
        expect(result2.body.data).toHaveLength(10); // page

        const result3 = await getPage(2);
        expect(result3.body.count).toBe(totalCount); // total requests
        expect(result3.body.data).toHaveLength(totalCount % 10); // page

        const allResults = [...result.body.data, ...result2.body.data, ...result3.body.data];

        const completed = allResults.filter(
          (x) => x.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
        );
        expect(completed).toHaveLength(completedCount);

        const notCompleted = allResults.filter(
          (x) => x.status !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
        );
        expect(notCompleted).toHaveLength(incompleteCount);

        const ids = new Set(allResults.map((x) => x.id));
        expect(ids.size).toBe(totalCount); // ie no duplicates in the two result sets
      });

      it('Should paginate correctly when sorting by completedAt and filtering by status', async () => {
        const getPage = async (page) => {
          const result = await app.get(
            `/api/imagingRequest?facilityId=${facilityId}&status=${IMAGING_REQUEST_STATUS_TYPES.COMPLETED}&orderBy=completedAt&page=${page}&order=ASC`,
          );
          expect(result).toHaveSucceeded();
          return result;
        };

        const result = await getPage(0);
        expect(result.body.count).toBe(completedCount); // total requests
        expect(result.body.data).toHaveLength(10); // page

        const result2 = await getPage(1);
        expect(result2.body.count).toBe(completedCount); // total requests
        expect(result2.body.data).toHaveLength(completedCount % 10); // page

        const result3 = await getPage(2);
        expect(result3.body.count).toBe(completedCount); // total requests
        expect(result3.body.data).toHaveLength(0); // page

        const allResults = [...result.body.data, ...result2.body.data, ...result3.body.data];

        const completed = allResults.filter(
          (x) => x.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
        );
        expect(completed).toHaveLength(completedCount);

        const notCompleted = allResults.filter(
          (x) => x.status !== IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
        );
        expect(notCompleted).toHaveLength(0);

        const ids = new Set(allResults.map((x) => x.id));
        expect(ids.size).toBe(completedCount); // ie no duplicates in the two result sets
      });
    });
  });

  describe('Approved column', () => {
    let testLocation;
    let testEncounter;
    let testInvoice;

    beforeAll(async () => {
      testLocation = await models.Location.create({
        ...fake(models.Location),
        facilityId,
      });
      testEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        locationId: testLocation.id,
        patientId: patient.id,
      });
      testInvoice = await models.Invoice.create({
        encounterId: testEncounter.id,
        displayId: 'INV-APPROVED-TEST',
        status: INVOICE_STATUSES.IN_PROGRESS,
        date: getCurrentDateTimeString(),
      });
    });

    const createImagingRequestWithAreas = async (areaCount = 1) => {
      const imagingRequest = await models.ImagingRequest.create({
        encounterId: testEncounter.id,
        imagingType: IMAGING_TYPES.X_RAY,
        requestedById: app.user.id,
      });

      const areas = [];
      for (let i = 0; i < areaCount; i++) {
        const area = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.X_RAY_IMAGING_AREA,
          }),
        );
        const imagingRequestArea = await models.ImagingRequestArea.create({
          imagingRequestId: imagingRequest.id,
          areaId: area.id,
        });
        areas.push(imagingRequestArea);
      }

      return { imagingRequest, areas };
    };

    it('should return null for approved when no invoice items exist', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest } = await createImagingRequestWithAreas(1);

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBeNull();
    });

    it('should return true for approved when all invoice items are approved', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest, areas } = await createImagingRequestWithAreas(2);

      // Create approved invoice items for each area
      for (const area of areas) {
        await models.InvoiceItem.create({
          invoiceId: testInvoice.id,
          sourceRecordId: area.id,
          sourceRecordType: 'ImagingRequestArea',
          approved: true,
          orderDate: getCurrentDateTimeString(),
          quantity: 1,
          orderedByUserId: user.id,
        });
      }

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(true);
    });

    it('should return false for approved when any invoice item is not approved', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest, areas } = await createImagingRequestWithAreas(2);

      // Create one approved and one unapproved invoice item
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: areas[0].id,
        sourceRecordType: 'ImagingRequestArea',
        approved: true,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: areas[1].id,
        sourceRecordType: 'ImagingRequestArea',
        approved: false,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(false);
    });

    it('should return false for approved when all invoice items are not approved', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest, areas } = await createImagingRequestWithAreas(1);

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: areas[0].id,
        sourceRecordType: 'ImagingRequestArea',
        approved: false,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(false);
    });

    it('should sort by approved column', async () => {
      await models.ImagingRequest.truncate({ cascade: true });

      // Create requests with different approval statuses
      const { imagingRequest: irApproved, areas: areasApproved } =
        await createImagingRequestWithAreas(1);
      const { areas: areasUnapproved } = await createImagingRequestWithAreas(1);
      const { imagingRequest: irNoItems } = await createImagingRequestWithAreas(1);

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: areasApproved[0].id,
        sourceRecordType: 'ImagingRequestArea',
        approved: true,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: areasUnapproved[0].id,
        sourceRecordType: 'ImagingRequestArea',
        approved: false,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      // Sort ASC - nulls first, then false, then true
      const resultAsc = await app.get(
        `/api/imagingRequest?facilityId=${facilityId}&orderBy=approved&order=ASC`,
      );
      expect(resultAsc).toHaveSucceeded();
      expect(resultAsc.body.data[0].id).toBe(irNoItems.id);
      expect(resultAsc.body.data[0].approved).toBeNull();

      // Sort DESC - true first, then false, then nulls
      const resultDesc = await app.get(
        `/api/imagingRequest?facilityId=${facilityId}&orderBy=approved&order=DESC`,
      );
      expect(resultDesc).toHaveSucceeded();
      expect(resultDesc.body.data[0].id).toBe(irApproved.id);
      expect(resultDesc.body.data[0].approved).toBe(true);
    });

    it('should use ImagingRequest invoice item when no area invoice items exist', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest } = await createImagingRequestWithAreas(1);

      // Create invoice item linked directly to ImagingRequest (not area)
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: imagingRequest.id,
        sourceRecordType: 'ImagingRequest',
        approved: true,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(true);
    });

    it('should prioritize ImagingRequestArea invoice items over ImagingRequest invoice items', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest, areas } = await createImagingRequestWithAreas(1);

      // Create unapproved invoice item for the area
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: areas[0].id,
        sourceRecordType: 'ImagingRequestArea',
        approved: false,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      // Create approved invoice item for the imaging request itself
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: imagingRequest.id,
        sourceRecordType: 'ImagingRequest',
        approved: true,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      // Should be false because area items take precedence
      expect(found.approved).toBe(false);
    });

    it('should return false for ImagingRequest invoice item when not approved', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest } = await createImagingRequestWithAreas(1);

      // Create unapproved invoice item linked to ImagingRequest
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: imagingRequest.id,
        sourceRecordType: 'ImagingRequest',
        approved: false,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      expect(found.approved).toBe(false);
    });

    it('should return true only when ImagingRequest invoice item is approved', async () => {
      await models.ImagingRequest.truncate({ cascade: true });
      const { imagingRequest } = await createImagingRequestWithAreas(1);

      // Create multiple invoice items for the same imaging request
      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: imagingRequest.id,
        sourceRecordType: 'ImagingRequest',
        approved: false,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/imagingRequest?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find((ir) => ir.id === imagingRequest.id);
      expect(found).toBeDefined();
      // Should be false because not all items are approved
      expect(found.approved).toBe(false);
    });
  });
});
