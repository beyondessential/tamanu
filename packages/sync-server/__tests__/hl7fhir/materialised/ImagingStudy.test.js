import { Op } from 'sequelize';

import { fake, fakeReferenceData, showError } from 'shared/test-helpers';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';
import { fakeUUID } from 'shared/utils/generateId';
import { sleepAsync } from 'shared/utils/sleepAsync';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - ImagingStudy`, () => {
  let ctx;
  let app;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');

    const {
      Department,
      Facility,
      ImagingAreaExternalCode,
      Location,
      Patient,
      ReferenceData,
      User,
      FhirPatient,
    } = ctx.store.models;

    const [practitioner, patient, area1, area2, facility] = await Promise.all([
      User.create(fake(User)),
      Patient.create(fake(Patient)),
      ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
      ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
      Facility.create(fake(Facility)),
    ]);

    const location = await Location.create(fake(Location, { facilityId: facility.id }));
    const department = await Department.create(
      fake(Department, { locationId: location.id, facilityId: facility.id }),
    );

    const [extCode1, extCode2, pat] = await Promise.all([
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area1.id })),
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area2.id })),
      FhirPatient.materialiseFromUpstream(patient.id),
    ]);

    resources = {
      practitioner,
      patient,
      area1,
      area2,
      facility,
      location,
      department,
      extCode1,
      extCode2,
      pat,
    };
  });
  afterAll(() => ctx.close());

  describe('create', () => {
    const PATH = `/v1/integration/${INTEGRATION_ROUTE}/ImagingStudy`;

    let encounter;
    beforeEach(async () => {
      const {
        Encounter,
        FhirServiceRequest,
        FhirWriteLog,
        ImagingRequest,
        ImagingRequestArea,
        ImagingResult,
      } = ctx.store.models;
      await FhirWriteLog.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await ImagingResult.destroy({ where: {} });

      encounter = await Encounter.create(
        fake(Encounter, {
          patientId: resources.patient.id,
          locationId: resources.location.id,
          departmentId: resources.department.id,
          examinerId: resources.practitioner.id,
        }),
      );
    });

    it('creates a result from an ImagingStudy with FHIR ID', () =>
      showError(async () => {
        // arrange
        const { FhirServiceRequest, ImagingRequest, ImagingResult } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: encounter.id,
            locationId: resources.location.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
            priority: 'routine',
            requestedDate: '2022-03-04 15:30:00',
          }),
        );
        await ir.setAreas([resources.area1.id, resources.area2.id]);
        await ir.reload();
        const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
        await FhirServiceRequest.resolveUpstreams();

        // act
        const body = {
          resourceType: 'ImagingStudy',
          status: 'final',
          identifier: [
            {
              system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
              value: 'ACCESSION',
            },
          ],
          basedOn: [
            {
              type: 'ServiceRequest',
              reference: `/ServiceRequest/${mat.id}`,
            },
          ],
          note: [{ text: 'This is an okay note' }, { text: 'This is another note' }],
        };
        const response = await app.post(PATH).send(body);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.status).toBe(201);
        const ires = await ImagingResult.findOne({
          where: { externalCode: 'ACCESSION' },
        });
        expect(ires).toBeTruthy();
        expect(ires.description).toEqual('This is an okay note\n\nThis is another note');
      }));

    it('creates a result from an ImagingStudy with upstream Display ID', () =>
      showError(async () => {
        // arrange
        const { FhirServiceRequest, ImagingRequest, ImagingResult } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: encounter.id,
            locationId: resources.location.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
            priority: 'routine',
            requestedDate: '2022-03-04 15:30:00',
          }),
        );
        await ir.setAreas([resources.area1.id, resources.area2.id]);
        await ir.reload();
        await FhirServiceRequest.materialiseFromUpstream(ir.id);
        await FhirServiceRequest.resolveUpstreams();

        // act
        const response = await app.post(PATH).send({
          resourceType: 'ImagingStudy',
          status: 'final',
          identifier: [
            {
              system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
              value: 'ACCESSION',
            },
          ],
          basedOn: [
            {
              type: 'ServiceRequest',
              identifier: {
                system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
                value: ir.displayId,
              },
            },
          ],
          note: [{ text: 'This is a bad note' }, { text: 'This is another note' }],
        });

        // assert
        expect(response).toHaveSucceeded();
        expect(response.status).toBe(201);
        const ires = await ImagingResult.findOne({
          where: { externalCode: 'ACCESSION' },
        });
        expect(ires).toBeTruthy();
        expect(ires.description).toEqual('This is a bad note\n\nThis is another note');
      }));

    it('creates a result from an ImagingStudy with upstream UUID', () =>
      showError(async () => {
        // arrange
        const {
          FhirServiceRequest,
          FhirWriteLog,
          ImagingRequest,
          ImagingResult,
        } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: encounter.id,
            locationId: resources.location.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
            priority: 'routine',
            requestedDate: '2022-03-04 15:30:00',
          }),
        );
        await ir.setAreas([resources.area1.id, resources.area2.id]);
        await ir.reload();
        await FhirServiceRequest.materialiseFromUpstream(ir.id);
        await FhirServiceRequest.resolveUpstreams();

        // act
        const body = {
          resourceType: 'ImagingStudy',
          status: 'final',
          identifier: [
            {
              system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
              value: 'ACCESSION',
            },
          ],
          basedOn: [
            {
              type: 'ServiceRequest',
              identifier: {
                system: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
                value: ir.id,
              },
            },
          ],
          note: [{ text: 'This is a good note' }, { text: 'This is another note' }],
        };
        const response = await app.post(PATH).send(body);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.status).toBe(201);
        const ires = await ImagingResult.findOne({
          where: { externalCode: 'ACCESSION' },
        });
        expect(ires).toBeTruthy();
        expect(ires.description).toEqual('This is a good note\n\nThis is another note');
        const flog = await FhirWriteLog.findOne({
          where: { url: { [Op.like]: '%ImagingStudy%' } },
        });
        expect(flog).toBeTruthy();
        expect(flog.verb).toEqual('POST');
        expect(flog.body).toMatchObject(body);
      }));

    it('logs the request even if not handled', () =>
      showError(async () => {
        const { FhirWriteLog } = ctx.store.models;

        // act
        const body = {
          resourceType: 'ImagingStudy',
          status: 'final',
          identifier: [
            {
              system: 'http://example.com',
              value: 'ACCESSION',
            },
          ],
          basedOn: [
            {
              type: 'ServiceRequest',
              identifier: {
                system: 'http://example.com',
                value: '123',
              },
            },
          ],
          note: [{ text: 'This is a fair note' }, { text: 'This is another note' }],
        };
        const response = await app.post(PATH).send(body);

        // This was failing intermittently, apparently we have to
        // seize control to let the FhirWriteLog create itself the second time
        await sleepAsync(1);

        // assert
        expect(response.status).not.toBe(201);
        const flog = await FhirWriteLog.findOne({
          where: { url: { [Op.like]: '%ImagingStudy%' } },
        });
        expect(flog).toBeTruthy();
        expect(flog.verb).toEqual('POST');
        expect(flog.body).toMatchObject(body);
      }));

    it('updates a result from an ImagingStudy', () =>
      showError(async () => {
        // arrange
        const { FhirServiceRequest, ImagingRequest, ImagingResult } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: encounter.id,
            locationId: resources.location.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
            priority: 'routine',
            requestedDate: '2022-03-04 15:30:00',
          }),
        );
        await ir.setAreas([resources.area1.id, resources.area2.id]);
        await ir.reload();
        const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
        await FhirServiceRequest.resolveUpstreams();

        const ires = await ImagingResult.create(
          fake(ImagingResult, {
            imagingRequestId: ir.id,
            externalCode: 'ACCESSION',
          }),
        );

        // act
        const response = await app.post(PATH).send({
          resourceType: 'ImagingStudy',
          status: 'final',
          identifier: [
            {
              system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
              value: 'ACCESSION',
            },
          ],
          basedOn: [
            {
              type: 'ServiceRequest',
              reference: `ServiceRequest/${mat.id}`,
            },
          ],
          note: [{ text: 'This is a fine note' }, { text: 'This is another note' }],
        });

        // assert
        expect(response).toHaveSucceeded();
        expect(response.status).toBe(201);
        await ires.reload();
        expect(ires.description).toEqual('This is a fine note\n\nThis is another note');
      }));

    describe('errors', () => {
      it('returns invalid if the resourceType does not match', async () => {
        // act
        const response = await app.post(`/v1/integration/${INTEGRATION_ROUTE}/ImagingStudy`).send({
          resourceType: 'Patient',
        });

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              details: {
                text: "must be 'ImagingStudy'",
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('returns invalid value if the status is not final', async () => {
        // arrange
        const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: encounter.id,
            locationId: resources.location.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
            priority: 'routine',
            requestedDate: '2022-03-04 15:30:00',
          }),
        );
        await ir.setAreas([resources.area1.id, resources.area2.id]);
        await ir.reload();
        const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
        await FhirServiceRequest.resolveUpstreams();

        // act
        const response = await app.post(`/v1/integration/${INTEGRATION_ROUTE}/ImagingStudy`).send({
          resourceType: 'ImagingStudy',
          status: 'pending',
          identifier: [
            {
              system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
              value: 'ACCESSION',
            },
          ],
          basedOn: [
            {
              type: 'ServiceRequest',
              reference: `/ServiceRequest/${mat.id}`,
            },
          ],
          note: [{ text: 'A note' }],
        });

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'value',
              diagnostics: expect.any(String),
              details: {
                text: "ImagingStudy status must be 'final'",
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('returns invalid structure if the service request id is missing', async () => {
        // act
        const response = await app.post(`/v1/integration/${INTEGRATION_ROUTE}/ImagingStudy`).send({
          resourceType: 'ImagingStudy',
          status: 'final',
          identifier: [
            {
              system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
              value: 'ACCESSION',
            },
          ],
          basedOn: [],
          note: [{ text: 'A note' }],
        });

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'structure',
              diagnostics: expect.any(String),
              details: {
                text: 'Need to have basedOn field that includes a Tamanu identifier',
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('returns invalid value if the service request cannot be found', async () => {
        const srId = fakeUUID();

        // act
        const response = await app.post(`/v1/integration/${INTEGRATION_ROUTE}/ImagingStudy`).send({
          resourceType: 'ImagingStudy',
          status: 'final',
          identifier: [
            {
              system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
              value: 'ACCESSION',
            },
          ],
          basedOn: [
            {
              type: 'ServiceRequest',
              identifier: {
                system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
                value: srId,
              },
            },
          ],
          note: [{ text: 'A note' }],
        });

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'value',
              diagnostics: expect.any(String),
              details: {
                text: `ServiceRequest ${srId} does not exist in Tamanu`,
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });
    });
  });
});
