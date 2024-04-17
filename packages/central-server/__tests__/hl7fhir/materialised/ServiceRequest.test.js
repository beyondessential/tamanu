/* eslint-disable no-unused-expressions */

import { addDays, formatRFC7231 } from 'date-fns';

import { fake, fakeReferenceData } from '@tamanu/shared/test-helpers';
import {
  FHIR_DATETIME_PRECISION,
  IMAGING_REQUEST_STATUS_TYPES,
  NOTE_TYPES,
  VISIBILITY_STATUSES,
  FHIR_REQUEST_PRIORITY,
} from '@tamanu/constants';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
  fakeResourcesOfFhirSpecimen,
} from '../../fake/fhir';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - ServiceRequest`, () => {
  let ctx;
  let app;
  let resources;
  const fhirResources = {
    fhirPractitioner: null,
    fhirEncounter: null,
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);
    const { FhirPractitioner } = ctx.store.models;
    const fhirPractitioner = await FhirPractitioner.materialiseFromUpstream(
      resources.practitioner.id,
    );
    fhirResources.fhirPractitioner = fhirPractitioner;
  });
  afterAll(() => ctx.close());

  describe('materialise', () => {
    beforeEach(async () => {
      const {
        FhirServiceRequest,
        ImagingRequest,
        ImagingRequestArea,
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
        FhirEncounter,
      } = ctx.store.models;
      await FhirEncounter.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });

      const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
      fhirResources.fhirEncounter = fhirEncounter;
    });

    it('fetches a service request by materialised ID (imaging request)', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest, Note } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
          locationGroupId: resources.locationGroup.id,
          status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
          priority: 'routine',
          requestedDate: '2022-03-04 15:30:00',
          imagingType: 'xRay',
        }),
      );
      await Note.bulkCreate([
        fake(Note, {
          date: '2022-03-05',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          noteType: NOTE_TYPES.OTHER,
          recordType: ImagingRequest.name,
          recordId: ir.id,
          content: 'Suspected adenoma',
        }),
        fake(Note, {
          date: '2022-03-06',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          noteType: NOTE_TYPES.OTHER,
          recordType: ImagingRequest.name,
          recordId: ir.id,
          content: 'Patient may need mobility assistance',
        }),
      ]);

      await ir.setAreas([resources.area1.id, resources.area2.id]);
      await ir.reload();
      const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();

      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;

      // act
      const response = await app.get(path);

      // normalise for comparison
      // eslint-disable-next-line no-unused-expressions
      response.body?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));
      response.body?.note?.sort((a, b) => a.time.localeCompare(b.time)); // sort notes by time

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
          reference: `Encounter/${fhirResources.fhirEncounter.id}`,
          type: 'Encounter',
        },
        occurrenceDateTime: formatFhirDate('2022-03-04 15:30:00'),
        requester: {
          type: 'Practitioner',
          reference: `Practitioner/${fhirResources.fhirPractitioner.id}`,
          display: fhirResources.fhirPractitioner.name[0].text,
        },
        locationCode: [
          {
            text: resources.facility.name,
          },
        ],
        note: [
          {
            time: formatFhirDate('2022-03-05'),
            text: 'Suspected adenoma',
          },
          {
            time: formatFhirDate('2022-03-06'),
            text: 'Patient may need mobility assistance',
          },
        ],
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response).toHaveSucceeded();

      // regression EPI-403
      expect(response.body.subject).not.toHaveProperty('identifier');
    });

    it('fetches a service request by materialised ID (lab request with panel)', async () => {
      // arrange
      const { FhirServiceRequest } = ctx.store.models;
      const { labTestPanel, labRequest, panelTestTypes } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        true,
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      await FhirServiceRequest.resolveUpstreams();

      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;

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
            value: labRequest.id,
          },
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html',
            value: labRequest.displayId,
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
        code: {
          coding: [
            {
              code: labTestPanel.code,
              display: labTestPanel.name,
              system:
                'https://www.senaite.com/profileCodes.html',
            },
            {
              code: labTestPanel.externalCode,
              display: labTestPanel.name,
              system:
                'http://loinc.org',
            },
          ],
        },
        subject: {
          reference: `Patient/${resources.fhirPatient.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        encounter: {
          reference: `Encounter/${fhirResources.fhirEncounter.id}`,
          type: 'Encounter',
        },
        occurrenceDateTime: formatFhirDate('2022-07-27 16:30:00'),
        requester: {
          type: 'Practitioner',
          reference: `Practitioner/${fhirResources.fhirPractitioner.id}`,
          display: fhirResources.fhirPractitioner.name[0].text,
        },
        locationCode: [],
        note: [],
      });

      response.body?.orderDetail.forEach(testType => {
        const currentTest = panelTestTypes.find(test => test.name === testType.text);
        expect(testType.text).toBe(currentTest.name);
        testType.coding?.forEach(testTypeCoding => {
          const { system, code } = testTypeCoding;
          expect(testTypeCoding.display).toBe(currentTest.name);
          expect(['https://www.senaite.com/testCodes.html', 'http://loinc.org']).toContain(system);
          if (system === 'https://www.senaite.com/testCodes.html') {
            expect(code).toBe(currentTest.code);
          } else if (system === 'http://loinc.org') {
            expect(code).toBe(currentTest.externalCode);
          }
        });
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response).toHaveSucceeded();

      // regression EPI-403
      expect(response.body.subject).not.toHaveProperty('identifier');
    });

    it('fetches a service request by materialised ID (lab request with unpanelled tests)', async () => {
      // arrange
      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest, testTypes } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        false,
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      await FhirServiceRequest.resolveUpstreams();

      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;

      // act
      const response = await app.get(path);
      // normalise for comparison
      // eslint-disable-next-line no-unused-expressions
      response.body?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));

      // assert
      expect(response.body.code).toBeUndefined();

      response.body?.orderDetail.forEach(testType => {
        const currentTest = testTypes.find(test => test.name === testType.text);
        expect(testType.text).toBe(currentTest.name);
        testType.coding?.forEach(testTypeCoding => {
          const { system, code } = testTypeCoding;
          expect(testTypeCoding.display).toBe(currentTest.name);
          expect(['https://www.senaite.com/testCodes.html', 'http://loinc.org']).toContain(system);
          if (system === 'https://www.senaite.com/testCodes.html') {
            expect(code).toBe(currentTest.code);
          } else if (system === 'http://loinc.org') {
            expect(code).toBe(currentTest.externalCode);
          }
        });
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response).toHaveSucceeded();
    });

    // Noting here that LabRequests have a priority in reference data 
    // while ImageRequests have a priority that is a string
    it('will materialise LabRequests into ServiceRequest with correct priority', async () => {
      // arrange
      const { FhirServiceRequest, ReferenceData } = ctx.store.models;
      const priorityKeys = Object.keys(FHIR_REQUEST_PRIORITY);
      let allPriorities = {};

      for (let priorityIndex = 0; priorityIndex < priorityKeys.length; priorityIndex++) {
        let currentKey = priorityKeys[priorityIndex];
        allPriorities[currentKey] = await ReferenceData.create({
          ...fakeReferenceData(currentKey),
          type: 'labTestPriority',
          name: FHIR_REQUEST_PRIORITY[currentKey],
          code: currentKey,
        });

        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          true,
          {
            labTestPriorityId: allPriorities[currentKey].id
          }
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        await FhirServiceRequest.resolveUpstreams();
        const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;

        // act
        const response = await app.get(path);
        response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'ServiceRequest',
          id: expect.any(String),
          priority: allPriorities[currentKey].name
        });
        expect(response).toHaveSucceeded();
      }
    });

    it('does not have a default priority if the source data has a null priority', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
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

      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;

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
      });
      expect(Object.keys(response.body).includes('priority')).toBe(false);
      expect(response).toHaveSucceeded();
    });

    it('searches a single service request by Tamanu UUID', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
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
      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?identifier=${id}`;

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
                type: 'Practitioner',
                reference: `Practitioner/${fhirResources.fhirPractitioner.id}`,
                display: fhirResources.fhirPractitioner.name[0].text,
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
          encounterId: resources.encounter.id,
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
      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?identifier=${id}`;

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
                type: 'Practitioner',
                reference: `Practitioner/${fhirResources.fhirPractitioner.id}`,
                display: fhirResources.fhirPractitioner.name[0].text,
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
    describe('Imaging Requests as ServiceRequests', () => {
      let irs;

      beforeAll(async () => {
        const {
          FhirEncounter,
          FhirServiceRequest,
          ImagingRequest,
          ImagingRequestArea,
        } = ctx.store.models;
        await FhirEncounter.destroy({ where: {} });
        await FhirServiceRequest.destroy({ where: {} });
        await ImagingRequest.destroy({ where: {} });
        await ImagingRequestArea.destroy({ where: {} });

        const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
        fhirResources.fhirEncounter = fhirEncounter;

        irs = await Promise.all([
          (async () => {
            const ir = await ImagingRequest.create(
              fake(ImagingRequest, {
                requestedById: resources.practitioner.id,
                encounterId: resources.encounter.id,
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
                encounterId: resources.encounter.id,
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
        const response = await app.get(`/api/integration/${INTEGRATION_ROUTE}/ServiceRequest`);

        expect(response.body.total).toBe(2);
        expect(response).toHaveSucceeded();
      });

      it('sorts by lastUpdated ascending', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=_lastUpdated`,
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
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=-_lastUpdated`,
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
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=status`,
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
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?_sort=priority`,
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
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?_lastUpdated=gt${formatFhirDate(
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
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?_lastUpdated=gt${encodeURIComponent(
            formatFhirDate(addDays(new Date(), 7)),
          )}`,
        );

        expect(response.body.total).toBe(1);
        expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[1].id);
        expect(response).toHaveSucceeded();
      });

      it('filters by upstream ID (identifier)', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?identifier=${irs[0].id}`,
        );

        expect(response.body.total).toBe(1);
        expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[0].id);
        expect(response).toHaveSucceeded();
      });

      it('filters by status', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?status=active`,
        );

        expect(response.body.total).toBe(1);
        expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[0].id);
        expect(response).toHaveSucceeded();
      });

      it('filters by priority', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?priority=urgent`,
        );

        expect(response.body.total).toBe(1);
        expect(response.body.entry[0].resource.identifier[0].value).toBe(irs[0].id);
        expect(response).toHaveSucceeded();
      });

      it('filters by category (match)', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005`,
        );

        expect(response.body.total).toBe(2);
        expect(response).toHaveSucceeded();
      });

      it('filters by category (no match)', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679123`,
        );

        expect(response.body.total).toBe(0);
        expect(response).toHaveSucceeded();
      });

      it('includes subject patient', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Patient:subject`,
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
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Patient:subject:Patient`,
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
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Patient:subject:Practitioner`,
        );

        expect(response.body.total).toBe(2);
        expect(response.body.entry.length).toBe(2);
        expect(response.body.entry.filter(({ search: { mode } }) => mode === 'match').length).toBe(2);
        expect(response).toHaveSucceeded();
      });

      it('includes encounter as materialised encounter', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Encounter:encounter`,
        );
        expect(response.body.total).toBe(2);
        expect(response.body.entry.length).toBe(3);
        expect(response.body.entry.filter(({ search: { mode } }) => mode === 'match').length).toBe(2);
        expect(
          response.body.entry.find(({ search: { mode } }) => mode === 'include')?.resource.id,
        ).toBe(fhirResources.fhirEncounter.id);
      });

      it('includes requester practitioner', async () => {
        const response = await app.get(
          `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?category=363679005&_include=Practitioner:requester`,
        );
        const practitionerRef = response.body.entry.find(
          ({ search: { mode } }) => mode === 'include',
        );
        expect(practitionerRef).toBeDefined();
        expect(practitionerRef.resource.id).toBe(fhirResources.fhirPractitioner.id);
        expect(practitionerRef.resource.name.length).toBe(1);
        expect(practitionerRef.resource.name[0].text).toBe(
          fhirResources.fhirPractitioner.name[0].text,
        );
        expect(response).toHaveSucceeded();
      });




    });

    describe('Lab Requests as ServiceRequests', () => {
      test.todo('Need to complete rigorous testing for aspects of Lab Requests searching here');

      describe('including', () => {
        const resolveUpstreams = async (sequelize) => {
          const result = await sequelize.query(`
            CALL fhir.resolve_upstreams();      
          `);
          return result;
        };

        beforeEach(async () => {
          const { models } = ctx.store;
          const { FhirSpecimen, FhirServiceRequest, LabRequest } = models;
          await FhirSpecimen.destroy({ where: {} });
          await FhirServiceRequest.destroy({ where: {} });
          await LabRequest.destroy({ where: {} });
        });

        it('correctly includes a ServiceRequest', async () => {
          const { models } = ctx.store;
          const { FhirSpecimen, FhirServiceRequest } = models;
          const { labRequest } = await fakeResourcesOfFhirSpecimen(models, resources);
          const materialisedServiceRequest = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
          const materialiseSpecimen = await FhirSpecimen.materialiseFromUpstream(labRequest.id);

          await FhirServiceRequest.resolveUpstreams();
          await FhirSpecimen.resolveUpstreams();

          const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest?_include=Specimen:specimen`;
          const response = await app.get(path);
          const { entry } = response.body;
          console.log({ entry });
          const fetchedServiceRequest = entry.find(
            ({ search: { mode } }) => mode === 'match',
          );

          const includedSpecimen = entry.find(
            ({ search: { mode } }) => mode === 'include',
          );
          expect(response).toHaveSucceeded();
          expect(includedSpecimen).toBeDefined();
          expect(fetchedServiceRequest.resource.id).toBe(materialisedServiceRequest.id);
          expect(includedSpecimen.resource.id).toBe(materialiseSpecimen.id);
          expect(response.body.entry.length).toBe(2);
        });
      });

    });
  });

  describe('errors', () => {
    it('returns not found when fetching a non-existent service request', async () => {
      // arrange
      const id = fakeUUID();
      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${id}`;

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
      const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest?whatever=something`;

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
