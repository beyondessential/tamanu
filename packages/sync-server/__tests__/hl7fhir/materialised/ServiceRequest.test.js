import { format, formatRFC7231 } from 'date-fns';

import { fake, fakeReferenceData } from 'shared/test-helpers/fake';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';

import { createTestContext } from '../../utilities';
import { fakeUUID } from 'shared/utils/generateId';
import { dateTimeStringIntoCountryTimezone } from 'shared/utils/dateTime';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - ServiceRequest`, () => {
  let ctx;
  let app;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');

    const {
      Encounter,
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

    const [location, encounter, extCode1, extCode2, pat] = await Promise.all([
      Location.create(fake(Location, { facilityId: facility.id })),
      Encounter.create(fake(Encounter, { patientId: patient.id })),
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
      encounter,
      extCode1,
      extCode2,
      pat,
    };
  });
  afterAll(() => ctx.close());

  describe('full resource checks', () => {
    beforeEach(async () => {
      const { FhirServiceRequest, ImagingRequest, ImagingRequestAreas } = ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestAreas.destroy({ where: {} });
    });

    it.only('fetches a service request by materialised ID', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
          locationId: resources.location.id,
          status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          priority: 'normal',
          requestedDate: '2022-03-04 15:30:00',
        }),
      );
      await ir.setAreas([resources.area1.id, resources.area2.id]);
      await ir.reload();
      const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();

      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;

      // act
      const response = await app.get(path);

      // assert
      console.log(response.body);
      expect(response.body).toMatchObject({
        resourceType: 'ServiceRequest',
        id: expect.any(String),
        meta: {
          lastUpdated: format(new Date(ir.updatedAt), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        },
        identifier: [
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
            value: ir.id,
          },
        ],
        status: 'completed',
        intent: 'order',
        category: [
          {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '363679005',
              },
            ],
          },
        ],
        priority: 'normal',
        code: {
          text: 'X-Ray',
        },
        orderDetail: [
          {
            text: resources.extCode1.description,
            coding: [
              {
                code: resources.extCode1.code,
                system: 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html',
              },
            ],
          },
          {
            text: resources.extCode2.description,
            coding: [
              {
                code: resources.extCode2.code,
                system: 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html',
              },
            ],
          },
        ],
        // subject: {
        //   reference: `Patient/${resources.pat.id}`,
        //   type: 'Patient',
        //   display: resources.patient.displayId,
        // },
        occurrenceDateTime: format(
          dateTimeStringIntoCountryTimezone('2022-03-04 15:30:00'),
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        ),
        requester: {
          display: resources.practitioner.displayName,
        },
        locationCode: [
          {
            text: resources.facility.name,
          },
        ],
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(ir.updatedAt)));
      expect(response).toHaveSucceeded();
    });

    it.skip('searches a single service request by Tamanu ID', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create({
        /* TODO */
      });
      await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();

      const id = encodeURIComponent(
        `http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html|${ir.id}`,
      );
      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?identifier=${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Bundle',
        id: expect.any(String),
        timestamp: expect.any(String),
        meta: {
          lastUpdated: format(new Date(ir.updatedAt), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        },
        type: 'searchset',
        total: 1,
        link: [
          {
            relation: 'self',
            url: expect.stringContaining(path),
          },
        ],
        entry: [
          {
            resource: {
              resourceType: 'ServiceRequest',
              id: expect.any(String),
              meta: {
                lastUpdated: format(new Date(ir.updatedAt), "yyyy-MM-dd'T'HH:mm:ssXXX"),
              },
              // identifier: [],
              // TODO
            },
          },
        ],
      });
      expect(response).toHaveSucceeded();
    });

    it.skip('returns a list of service requests when passed no query params', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const irs = await Promise.all([
        ImagingRequest.create({
          /* TODO */
        }),
        ImagingRequest.create({
          /* TODO */
        }),
      ]);
      await Promise.all(ir.map(({ id }) => FhirServiceRequest.materialiseFromUpstream(id)));
      await FhirServiceRequest.resolveUpstreams();
      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body.total).toBe(2);
      expect(response).toHaveSucceeded();
    });
  });

  describe('sorting', () => {
    beforeEach(async () => {});

    it.todo('sorts by lastUpdated ascending');
    it.todo('sorts by lastUpdated descending');

    it.todo('sorts by status');
    it.todo('sorts by intent');
    it.todo('sorts by priority');
    it.todo('sorts by code');
  });

  describe('filtering', () => {
    beforeEach(async () => {});

    it.todo('filters by lastUpdated:gt');

    it.todo('filters by upstream ID (identifier)');
    it.todo('filters by status');
    it.todo('filters by intent');
    it.todo('filters by priority');
    it.todo('filters by code');
  });

  describe('errors', () => {
    it('returns not found when fetching a non-existent service request', async () => {
      // arrange
      const id = fakeUUID();
      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest/${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: expect.any(String),
            details: {
              text: `no ServiceRequest with id ${id}`,
            },
          },
        ],
      });
      expect(response.status).toBe(404);
    });

    it('returns an error if there are any unknown search params', async () => {
      // arrange
      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?whatever=something`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-supported',
            diagnostics: expect.any(String),
            details: {
              text: 'parameter is not supported: whatever',
            },
          },
        ],
      });
      expect(response).toHaveRequestError(501);
    });
  });
});
