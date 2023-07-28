/* eslint-disable no-unused-expressions */

import { addDays, formatRFC7231 } from 'date-fns';

import { fake, fakeReferenceData } from 'shared/test-helpers';
import {
  FHIR_DATETIME_PRECISION,
  IMAGING_REQUEST_STATUS_TYPES,
  NOTE_TYPES,
  VISIBILITY_STATUSES,
  LAB_REQUEST_STATUSES,
} from 'shared/constants';
import { randomLabRequest } from '@tamanu/shared/demoData';
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

    const [extCode1, extCode2, fhirPatient, locationGroup] = await Promise.all([
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area1.id })),
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area2.id })),
      FhirPatient.materialiseFromUpstream(patient.id),
      LocationGroup.create(fake(LocationGroup, { facilityId: facility.id })),
    ]);

    const location = await Location.create(
      fake(Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
    );
    const department = await Department.create(
      fake(Department, { locationId: location.id, facilityId: facility.id }),
    );

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
      fhirPatient,
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
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
      } = ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });

      encounter = await Encounter.create(
        fake(Encounter, {
          patientId: resources.patient.id,
          locationId: resources.location.id,
          departmentId: resources.department.id,
          examinerId: resources.practitioner.id,
        }),
      );
    });

    it('fetches a service request by materialised ID (imaging request)', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest, NoteItem, NotePage } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: encounter.id,
          locationGroupId: resources.locationGroup.id,
          status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          priority: 'routine',
          requestedDate: '2022-03-04 15:30:00',
          imagingType: 'xRay',
        }),
      );
      const [np1, np2] = await NotePage.bulkCreate([
        fake(NotePage, {
          date: '2022-03-05',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          noteType: NOTE_TYPES.OTHER,
          recordType: ImagingRequest.name,
          recordId: ir.id,
        }),
        fake(NotePage, {
          date: '2022-03-06',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          noteType: NOTE_TYPES.OTHER,
          recordType: ImagingRequest.name,
          recordId: ir.id,
        }),
      ]);
      await NoteItem.bulkCreate([
        fake(NoteItem, { notePageId: np1.id, content: 'Suspected adenoma' }),
        fake(NoteItem, { notePageId: np1.id, content: 'Patient may need mobility assistance' }),
        fake(NoteItem, {
          notePageId: np2.id,
          content: 'Patient may have shrapnel in leg - need to confirm beforehand',
        }),
      ]);

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
          lastUpdated: formatFhirDate(mat.lastUpdated),
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
          reference: `Patient/${resources.fhirPatient.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        encounter: {
          reference: `Encounter/${encounter.id}`,
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
        note: [
          {
            time: formatFhirDate('2022-03-05'),
            text: `Suspected adenoma

Patient may need mobility assistance`,
          },
          {
            time: formatFhirDate('2022-03-06'),
            text: 'Patient may have shrapnel in leg - need to confirm beforehand',
          },
        ],
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response).toHaveSucceeded();

      // regression EPI-403
      expect(response.body.subject).not.toHaveProperty('identifier');
    });

    it('fetches a service request by materialised ID (lab request)', async () => {
      // arrange
      const {
        FhirServiceRequest,
        LabRequest,
        ReferenceData,
        LabTestPanel,
        LabTestPanelRequest,
      } = ctx.store.models;
      const category = await ReferenceData.create({
        id: 'test1',
        type: 'labTestCategory',
        code: 'test1',
        name: 'Test 1',
      });
      const labTestPanel = await LabTestPanel.create({
        ...fake(LabTestPanel),
        categoryId: category.id,
      });
      const labTestPanelRequest = await LabTestPanelRequest.create({
        ...fake(LabTestPanelRequest),
        labTestPanelId: labTestPanel.id,
        encounterId: encounter.id,
      });
      const labRequestData = await randomLabRequest(ctx.store.models, {
        requestedById: resources.practitioner.id,
        patientId: resources.patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        labTestPanelRequestId: labTestPanelRequest.id, // make one of them part of a panel
        requestedDate: '2022-07-27 16:30:00',
      });
      const lr = await LabRequest.create(labRequestData);
      const mat = await FhirServiceRequest.materialiseFromUpstream(lr.id);
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
          lastUpdated: formatFhirDate(mat.lastUpdated),
        },
        identifier: [
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-labrequest.html',
            value: lr.id,
          },
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html',
            value: lr.displayId,
          },
        ],
        status: 'completed',
        intent: 'order',
        category: [
          {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '108252007',
              },
            ],
          },
        ],
        priority: 'routine',
        code: {
          coding: [
            {
              code: labTestPanel.externalCode,
              display: labTestPanel.name,
              system:
                'http://intersystems.com/fhir/extn/sda3/lib/code-table-translated-prior-codes',
            },
          ],
        },
        orderDetail: [],
        subject: {
          reference: `Patient/${resources.fhirPatient.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        encounter: {
          reference: `Encounter/${encounter.id}`,
        },
        occurrenceDateTime: formatFhirDate('2022-07-27 16:30:00'),
        requester: {
          display: resources.practitioner.displayName,
          reference: `Practitioner/${resources.practitioner.id}`,
        },
        locationCode: [],
        note: [],
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
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
          imagingType: 'xRay',
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
          imagingType: 'xRay',
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
                lastUpdated: expect.any(String),
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
                reference: `Patient/${resources.fhirPatient.id}`,
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
          imagingType: 'xRay',
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
                lastUpdated: expect.any(String),
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
                reference: `Patient/${resources.fhirPatient.id}`,
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
          await ir.reload();
          const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
          mat.update({ lastUpdated: addDays(new Date(), 5) });
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
          await ir.reload();
          const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
          mat.update({ lastUpdated: addDays(new Date(), 10) });
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
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_lastUpdated=gt${formatFhirDate(
          addDays(new Date(), 7),
          FHIR_DATETIME_PRECISION.DAYS,
        )}`,
      );

      expect(response.body.total).toBe(1);
      expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[1].id);
      expect(response).toHaveSucceeded();
    });

    it('filters by lastUpdated=gt with a datetime', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_lastUpdated=gt${encodeURIComponent(
          formatFhirDate(addDays(new Date(), 7)),
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

    it('includes subject patient', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Patient:subject`,
      );

      expect(response.body.total).toBe(2);
      expect(response.body.entry.length).toBe(3);
      expect(response.body.entry.filter(({ search: { mode } }) => mode === 'match').length).toBe(2);
      expect(
        response.body.entry.find(({ search: { mode } }) => mode === 'include')?.resource.id,
      ).toBe(resources.fhirPatient.id);
      expect(response).toHaveSucceeded();
    });

    it('includes subject patient with targetType (match)', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Patient:subject:Patient`,
      );

      expect(response.body.total).toBe(2);
      expect(response.body.entry.length).toBe(3);
      expect(response.body.entry.filter(({ search: { mode } }) => mode === 'match').length).toBe(2);
      expect(
        response.body.entry.find(({ search: { mode } }) => mode === 'include')?.resource.id,
      ).toBe(resources.fhirPatient.id);
      expect(response).toHaveSucceeded();
    });

    it('includes subject patient with targetType (no match)', async () => {
      const response = await app.get(
        `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Patient:subject:Practitioner`,
      );

      expect(response.body.total).toBe(2);
      expect(response.body.entry.length).toBe(2);
      expect(response.body.entry.filter(({ search: { mode } }) => mode === 'match').length).toBe(2);
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
