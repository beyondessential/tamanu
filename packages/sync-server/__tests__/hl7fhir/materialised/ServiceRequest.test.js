/* eslint-disable no-unused-expressions */

import { addDays, format, formatRFC7231 } from 'date-fns';

import { fake, fakeReferenceData } from 'shared/test-helpers';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { fakeUUID } from 'shared/utils/generateId';
import { formatFhirDate } from 'shared/utils/fhir/datetime';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - ServiceRequest`, () => {
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
      LocationGroup,
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

    const [extCode1, extCode2, pat, locationGroup] = await Promise.all([
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area1.id })),
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area2.id })),
      FhirPatient.materialiseFromUpstream(patient.id),
      LocationGroup.create(
        fake(LocationGroup, { facilityId: facility.id, locationId: location.id }),
      ),
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
      locationGroup,
    };
  });
  afterAll(() => ctx.close());

  describe('materialise', () => {
    let encounter;
    beforeEach(async () => {
      const {
        Encounter,
        FhirServiceRequest,
        ImagingRequest,
        ImagingRequestArea,
      } = ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });

      encounter = await Encounter.create(
        fake(Encounter, {
          patientId: resources.patient.id,
          locationId: resources.location.id,
          departmentId: resources.department.id,
          examinerId: resources.practitioner.id,
        }),
      );
    });

    it('fetches a service request by materialised ID', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: encounter.id,
          locationGroupId: resources.locationGroup.id,
          status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          priority: 'routine',
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

      // normalise for comparison
      // eslint-disable-next-line no-unused-expressions
      response.body?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'ServiceRequest',
        id: expect.any(String),
        meta: {
          lastUpdated: formatFhirDate(ir.updatedAt),
        },
        identifier: [
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
            value: ir.id,
          },
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
            value: ir.displayId,
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
        priority: 'routine',
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
        ].sort((a, b) => a.text.localeCompare(b.text)),
        subject: {
          reference: `Patient/${resources.pat.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        occurrenceDateTime: formatFhirDate('2022-03-04 15:30:00'),
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

      // regression EPI-403
      expect(response.body.subject).not.toHaveProperty('identifier');
    });

    it('materialises the default priority if the source data has a null priority', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: encounter.id,
          locationGroupId: resources.locationGroup.id,
          status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          priority: null,
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
      response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'ServiceRequest',
        id: expect.any(String),
        identifier: [
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
            value: ir.id,
          },
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
            value: ir.displayId,
          },
        ],
        priority: 'routine',
      });
      expect(response).toHaveSucceeded();
    });

    it('searches a single service request by Tamanu UUID', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: encounter.id,
          locationGroupId: resources.locationGroup.id,
          status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          priority: 'routine',
          requestedDate: '2023-11-12 13:14:15',
        }),
      );
      await ir.setAreas([resources.area1.id, resources.area2.id]);
      await ir.reload();
      await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();

      const id = encodeURIComponent(
        `http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html|${ir.id}`,
      );
      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?identifier=${id}`;

      // act
      const response = await app.get(path);
      response.body?.entry?.[0]?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.entry?.[0]?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Bundle',
        id: expect.any(String),
        timestamp: expect.any(String),
        meta: {
          lastUpdated: formatFhirDate(ir.updatedAt),
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
                lastUpdated: formatFhirDate(ir.updatedAt),
              },
              identifier: [
                {
                  system: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
                  value: ir.id,
                },
                {
                  system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
                  value: ir.displayId,
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
              priority: 'routine',
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
              subject: {
                reference: `Patient/${resources.pat.id}`,
                type: 'Patient',
                display: `${resources.patient.firstName} ${resources.patient.lastName}`,
              },
              occurrenceDateTime: formatFhirDate('2022-03-04 15:30:00'),
              requester: {
                display: resources.practitioner.displayName,
              },
              locationCode: [
                {
                  text: resources.facility.name,
                },
              ],
            },
          },
        ],
      });
      expect(response).toHaveSucceeded();
    });

    it('searches a single service request by Tamanu Display ID', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: encounter.id,
          locationGroupId: resources.locationGroup.id,
          status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          priority: 'routine',
          requestedDate: '2023-11-12 13:14:15',
        }),
      );
      await ir.setAreas([resources.area1.id, resources.area2.id]);
      await ir.reload();
      await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();

      const id = encodeURIComponent(
        `http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html|${ir.displayId}`,
      );
      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?identifier=${id}`;

      // act
      const response = await app.get(path);
      response.body?.entry?.[0]?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.entry?.[0]?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

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
              identifier: [
                {
                  system: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
                  value: ir.id,
                },
                {
                  system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
                  value: ir.displayId,
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
              priority: 'routine',
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
              subject: {
                reference: `Patient/${resources.pat.id}`,
                type: 'Patient',
                display: `${resources.patient.firstName} ${resources.patient.lastName}`,
              },
              occurrenceDateTime: formatFhirDate('2023-11-12 13:14:15'),
              requester: {
                display: resources.practitioner.displayName,
              },
              locationCode: [
                {
                  text: resources.facility.name,
                },
              ],
            },
          },
        ],
      });
      expect(response).toHaveSucceeded();
    });
  });

  describe('search', () => {
    let encounter;
    let irs;
    beforeAll(async () => {
      const {
        Encounter,
        FhirServiceRequest,
        ImagingRequest,
        ImagingRequestArea,
      } = ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });

      encounter = await Encounter.create(
        fake(Encounter, {
          patientId: resources.patient.id,
          locationId: resources.location.id,
          departmentId: resources.department.id,
          examinerId: resources.practitioner.id,
        }),
      );

      irs = await Promise.all([
        (async () => {
          const ir = await ImagingRequest.create(
            fake(ImagingRequest, {
              requestedById: resources.practitioner.id,
              encounterId: encounter.id,
              locationId: resources.location.id,
              status: IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
              priority: 'urgent',
              requestedDate: '2022-03-04 15:30:00',
            }),
          );

          await ir.setAreas([resources.area1.id]);
          await ImagingRequest.sequelize.query(
            `UPDATE imaging_requests SET updated_at = $1 WHERE id = $2`,
            { bind: [addDays(new Date(), 5), ir.id] },
          );
          await ir.reload();
          await FhirServiceRequest.materialiseFromUpstream(ir.id);
          return ir;
        })(),
        (async () => {
          const ir = await ImagingRequest.create(
            fake(ImagingRequest, {
              requestedById: resources.practitioner.id,
              encounterId: encounter.id,
              locationId: resources.location.id,
              status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
              priority: 'routine',
              requestedDate: '2023-11-12 13:14:15',
            }),
          );

          await ir.setAreas([resources.area2.id]);
          await ImagingRequest.sequelize.query(
            `UPDATE imaging_requests SET updated_at = $1 WHERE id = $2`,
            { bind: [addDays(new Date(), 10), ir.id] },
          );
          await ir.reload();
          await FhirServiceRequest.materialiseFromUpstream(ir.id);
          return ir;
        })(),
      ]);
      await FhirServiceRequest.resolveUpstreams();
    });

    it('returns a list when passed no query params', async () => {
      const response = await app.get(`/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest`);

      expect(response.body.total).toBe(2);
      expect(response).toHaveSucceeded();
    });

    it('sorts by lastUpdated ascending', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=_lastUpdated`,
      );

      expect(response.body.total).toBe(2);
      expect(response.body.entry.map(entry => entry.resource.identifier[0].value)).toEqual([
        irs[0].id,
        irs[1].id,
      ]);
      expect(response).toHaveSucceeded();
    });

    it('sorts by lastUpdated descending', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=-_lastUpdated`,
      );

      expect(response.body.total).toBe(2);
      expect(response.body.entry.map(entry => entry.resource.identifier[0].value)).toEqual([
        irs[1].id,
        irs[0].id,
      ]);
      expect(response).toHaveSucceeded();
    });

    it('sorts by status', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=status`,
      );

      expect(response.body.total).toBe(2);
      expect(response.body.entry.map(entry => entry.resource.identifier[0].value)).toEqual([
        irs[0].id, // active
        irs[1].id, // completed
      ]);
      expect(response).toHaveSucceeded();
    });

    it('sorts by priority', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=priority`,
      );

      expect(response.body.total).toBe(2);
      expect(response.body.entry.map(entry => entry.resource.identifier[0].value)).toEqual([
        irs[1].id, // normal
        irs[0].id, // urgent
      ]);
      expect(response).toHaveSucceeded();
    });

    it('filters by lastUpdated=gt with a date', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_lastUpdated=gt${format(
          addDays(new Date(), 7),
          'yyyy-MM-dd',
        )}`,
      );

      expect(response.body.total).toBe(1);
      expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[1].id);
      expect(response).toHaveSucceeded();
    });

    it('filters by lastUpdated=gt with a datetime', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_lastUpdated=gt${encodeURIComponent(
          format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        )}`,
      );

      expect(response.body.total).toBe(1);
      expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[1].id);
      expect(response).toHaveSucceeded();
    });

    it('filters by upstream ID (identifier)', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?identifier=${irs[0].id}`,
      );

      expect(response.body.total).toBe(1);
      expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[0].id);
      expect(response).toHaveSucceeded();
    });

    it('filters by status', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?status=active`,
      );

      expect(response.body.total).toBe(1);
      expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[0].id);
      expect(response).toHaveSucceeded();
    });

    it('filters by priority', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?priority=urgent`,
      );

      expect(response.body.total).toBe(1);
      expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[0].id);
      expect(response).toHaveSucceeded();
    });

    it('filters by category (match)', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005`,
      );

      expect(response.body.total).toBe(2);
      expect(response).toHaveSucceeded();
    });

    it('filters by category (no match)', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679123`,
      );

      expect(response.body.total).toBe(0);
      expect(response).toHaveSucceeded();
    });
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
