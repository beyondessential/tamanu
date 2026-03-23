/* eslint-disable no-unused-expressions */
import dateFnsTz from 'date-fns-tz';

import {
  LAB_REQUEST_STATUSES,
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  SUPPORTED_CONTENT_TYPES,
} from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
  fakeResourcesOfFhirServiceRequestWithImagingRequest,
} from '../../fake/fhir';
import { base64pdf } from '@tamanu/shared/test-helpers';

describe('Create DiagnosticReport', () => {
  let ctx;
  let app;
  let resources;
  const fhirResources = {
    fhirPractitioner: null,
    fhirEncounter: null,
  };
  const INTEGRATION_ROUTE = 'fhir/mat';
  const endpoint = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport`;
  const postBody = (serviceRequestId) => ({
    resourceType: 'DiagnosticReport',
    basedOn: [
      {
        type: 'ServiceRequest',
        reference: `ServiceRequest/${serviceRequestId}`,
      },
    ],
    status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
    category: [
      {
        coding: [
          {
            code: '108252007',
            system: 'http://snomed.info/sct',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '42191-7',
          display: 'Hepatitis Panel',
        },
      ],
    },
  });
  const testAttachment = {
    contentType: 'application/pdf',
    data: base64pdf,
    title:
      'LAB ID: P73456090 MAX JONES Biopsy without Microscopic Description (1 Site/Lesion)-Standard',
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

  describe('create', () => {
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

    it('post a DiagnosticReport to acknowledge results from ServiceRequest (Lab Request)', async () => {
      const tests = [
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._ },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._, presentedForm: [testAttachment] },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY },
        {
          status: FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY,
          presentedForm: [testAttachment],
        },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL, presentedForm: [testAttachment] },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._ },
        { status: FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR },
      ];
      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
        },
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      const body = postBody(serviceRequestId);
      // Look I know this is pretty oldskool
      // and we like to be more declarative these days
      // but a mapping to Promise.all will likely
      // create some bad time race conditions
      // sometimes the old ways are the best
      for (let index = 0; index < tests.length; index++) {
        body.status = tests[index].status;
        body.presentedForm = tests[index].presentedForm;
        let expectedLabRequestStatus;
        if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.RESULTS_PENDING;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._ && body.presentedForm) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.INTERIM_RESULTS;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.RESULTS_PENDING;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY &&
          body.presentedForm
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.INTERIM_RESULTS;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL && body.presentedForm) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.PUBLISHED;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.VERIFIED;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.REJECTED;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.INVALIDATED;
        } else if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;
        }
        const response = await app.post(endpoint).send(body);
        await labRequest.reload();
        expect(labRequest.status).toBe(expectedLabRequestStatus);
        expect(response).toHaveSucceeded();

        // Reset the labRequest status
        labRequest.set({ status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED });
        await labRequest.save();
      }
    });

    it('post a DiagnosticReport to a ServiceRequest', async () => {
      const fakeDate = new Date('2020-01-01');
      jest.useFakeTimers().setSystemTime(fakeDate);

      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        },
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      const body = postBody(serviceRequestId);
      body.status = FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL;
      body.presentedForm = [testAttachment];

      const response = await app.post(endpoint).send(body);
      await labRequest.reload();
      expect(response).toHaveSucceeded();
      expect(labRequest.status).toBe(LAB_REQUEST_STATUSES.PUBLISHED);
      expect(labRequest.publishedDate).toBe(dateFnsTz.format(fakeDate, 'yyyy-MM-dd HH:mm:ss'));
      expect((await labRequest.getLatestAttachment()).title).toBe(testAttachment.title);
    });

    it('post a DiagnosticReport to a completed ServiceRequest (published Lab Request)', async () => {
      const statuses = [
        FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED,
        FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._,
        FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY,
        FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
        FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED,
        FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._,
        FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR,
      ];
      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.PUBLISHED,
        },
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      const body = postBody(serviceRequestId);
      for (let index = 0; index < statuses.length; index++) {
        body.status = statuses[index];
        let expectedLabRequestStatus;
        // Once in a published state, a Lab Request can only transition to invalidated (ignore all other changes to the status)
        if (body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.INVALIDATED;
        } else {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.PUBLISHED;
        }
        const response = await app.post(endpoint).send(body);
        await labRequest.reload();
        expect(labRequest.status).toBe(expectedLabRequestStatus);
        expect(response).toHaveSucceeded();

        // Reset the labRequest status
        labRequest.set({ status: LAB_REQUEST_STATUSES.PUBLISHED });
        await labRequest.save();
      }
    });

    it('post a DiagnosticReport with PDF report in presentedForm (Lab Request)', async () => {
      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.PUBLISHED,
        },
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      let requestAttachment = await labRequest.getLatestAttachment();
      expect(requestAttachment).toBeNull();

      const body = {
        ...postBody(serviceRequestId),
        presentedForm: [
          {
            ...testAttachment,
          },
        ],
      };
      const response = await app.post(endpoint).send(body);
      await labRequest.reload();
      requestAttachment = await labRequest.getLatestAttachment();
      expect(labRequest.status).toBe(LAB_REQUEST_STATUSES.PUBLISHED);
      expect(requestAttachment).toMatchObject({
        labRequestId: labRequest.id,
        replacedById: null,
        title: testAttachment.title,
      });
      expect(response).toHaveSucceeded();
    });

    describe('errors', () => {
      it('error if attach a diagnosticReport to an ImagingRequest', async () => {
        const { FhirServiceRequest } = ctx.store.models;
        const imagingRequest = await fakeResourcesOfFhirServiceRequestWithImagingRequest(
          ctx.store.models,
          resources,
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();

        const body = postBody(serviceRequestId);
        const response = await app.post(endpoint).send(body);
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              details: {
                text: `No LabRequest with id: '${imagingRequest.id}', might be ImagingRequest id`,
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('returns invalid if the resourceType does not match', async () => {
        const { FhirServiceRequest } = ctx.store.models;
        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          {
            isWithPanels: true,
          },
          {
            status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
          },
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();

        const body = postBody(serviceRequestId);
        body.resourceType = 'Patient';
        const response = await app.post(endpoint).send(body);
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              details: {
                text: "must be 'DiagnosticReport'",
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('reports invalid if using unsupported statuses', async () => {
        const statuses = [
          FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.CORRECTED,
          FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.APPENDED,
        ];
        const { FhirServiceRequest } = ctx.store.models;
        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          {
            isWithPanels: true,
          },
          {
            status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
          },
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();
        const body = postBody(serviceRequestId);

        for (let index = 0; index < statuses.length; index++) {
          const status = statuses[index];
          body.status = status;
          const response = await app.post(endpoint).send(body);
          await labRequest.reload();
          expect(response.body).toMatchObject({
            resourceType: 'OperationOutcome',
            id: expect.any(String),
            issue: [
              {
                severity: 'error',
                code: 'invalid',
                diagnostics: expect.any(String),
                details: {
                  text: `${status} workflow unsupported`,
                },
              },
            ],
          });
          expect(response.status).toBe(400);
        }
      });

      it('reports invalid if using invalid statuses', async () => {
        const { FhirServiceRequest } = ctx.store.models;
        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          {
            isWithPanels: true,
          },
          {
            status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
          },
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();
        const body = postBody(serviceRequestId);

        body.status = 'unstatus';
        const response = await app.post(endpoint).send(body);

        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              details: {
                text: "'unstatus' is an invalid ServiceRequest status",
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('reports invalid if using unsupported statuses', async () => {
        const statuses = [
          FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.CORRECTED,
          FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.APPENDED,
        ];
        const { FhirServiceRequest } = ctx.store.models;
        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          {
            isWithPanels: true,
          },
          {
            status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
          },
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();
        const body = postBody(serviceRequestId);

        for (let index = 0; index < statuses.length; index++) {
          const status = statuses[index];
          body.status = status;
          const response = await app.post(endpoint).send(body);
          await labRequest.reload();
          expect(response.body).toMatchObject({
            resourceType: 'OperationOutcome',
            id: expect.any(String),
            issue: [
              {
                severity: 'error',
                code: 'invalid',
                diagnostics: expect.any(String),
                details: {
                  text: `${status} workflow unsupported`,
                },
              },
            ],
          });
          expect(response.status).toBe(400);
        }
      });

      it('returns invalid structure if the service request id is missing', async () => {
        const { FhirServiceRequest } = ctx.store.models;
        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          {
            isWithPanels: true,
          },
          {
            status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
          },
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();
        const body = postBody(serviceRequestId);
        delete body.basedOn;
        const response = await app.post(endpoint).send(body);
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              details: {
                text: 'basedOn is a required field',
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('report in presentedForm in invalid type', async () => {
        const { FhirServiceRequest } = ctx.store.models;
        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          {
            isWithPanels: true,
          },
          {
            status: LAB_REQUEST_STATUSES.PUBLISHED,
          },
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();
        const testAttachment = {
          contentType: 'application/jpeg',
          data: base64pdf,
          title:
            'LAB ID: P73456090 MAX JONES Biopsy without Microscopic Description (1 Site/Lesion)-Standard',
        };
        const body = {
          ...postBody(serviceRequestId),
          presentedForm: [
            {
              ...testAttachment,
            },
          ],
        };
        const response = await app.post(endpoint).send(body);
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: expect.any(String),
              details: {
                text: `presentedForm must be one of the supported values: ${Object.values(
                  SUPPORTED_CONTENT_TYPES,
                )}`,
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });
    });
  });
});
