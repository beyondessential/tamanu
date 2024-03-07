/* eslint-disable no-unused-expressions */

import { addDays, formatRFC7231 } from 'date-fns';

import { fake } from '@tamanu/shared/test-helpers';
import {
  FHIR_DATETIME_PRECISION,
  IMAGING_REQUEST_STATUS_TYPES,
  VISIBILITY_STATUSES,
  LAB_REQUEST_STATUSES,
  FHIR_DIAGNOSTIC_REPORT_STATUS,
} from '@tamanu/constants';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
  fakeResourcesOfFhirServiceRequestWithImagingRequest,
} from '../../fake/fhir';




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
  const postBody = serviceRequestId => ({
    resourceType: "DiagnosticReport",
    basedOn: {
      type: "ServiceRequest",
      reference: `ServiceRequest/${serviceRequestId}`
    },
    status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
    category: [
      {
        coding: [
          {
            code: "108252007",
            system: "http://snomed.info/sct"
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "42191-7",
          display: "Hepatitis Panel"
        }
      ]
    },
  });

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

    it('fetches a service request by materialised ID (lab request)', async () => {
      const statuses = [
        FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED,
        FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._,
        FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY,
        FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
        FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED,
        FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR,
        // FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._,
        // FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.CORRECTED,
        // FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.APPENDED,
      ];
      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
        }
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
      for (let index = 0; index < statuses.length; index++) {
        body.status = statuses[index];
        let expectedLabRequestStatus;
        if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED ||
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.VERIFIED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.PUBLISHED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.CANCELLED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;
        }
        const response = await app.post(endpoint).send(body);
        await labRequest.reload();
        expect(labRequest.status).toBe(expectedLabRequestStatus);
        expect(response).toHaveSucceeded();
      }
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
                text: `No LabRequest with id: ${imagingRequest.id}, might be ImagingRequest id`,
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
            status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
          }
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

      // it('returns invalid value if the status is not final', async () => {
      //   // arrange
      //   const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      //   const ir = await ImagingRequest.create(
      //     fake(ImagingRequest, {
      //       requestedById: resources.practitioner.id,
      //       encounterId: encounter.id,
      //       locationId: resources.location.id,
      //       status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
      //       priority: 'routine',
      //       requestedDate: '2022-03-04 15:30:00',
      //     }),
      //   );
      //   await ir.setAreas([resources.area1.id, resources.area2.id]);
      //   await ir.reload();
      //   const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      //   await FhirServiceRequest.resolveUpstreams();

      //   // act
      //   const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/ImagingStudy`).send({
      //     resourceType: 'ImagingStudy',
      //     status: 'pending',
      //     identifier: [
      //       {
      //         system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
      //         value: 'ACCESSION',
      //       },
      //     ],
      //     basedOn: [
      //       {
      //         type: 'ServiceRequest',
      //         reference: `/ServiceRequest/${mat.id}`,
      //       },
      //     ],
      //     note: [{ text: 'A note' }],
      //   });

      //   // assert
      //   expect(response.body).toMatchObject({
      //     resourceType: 'OperationOutcome',
      //     id: expect.any(String),
      //     issue: [
      //       {
      //         severity: 'error',
      //         code: 'value',
      //         diagnostics: expect.any(String),
      //         details: {
      //           text: "ImagingStudy status must be 'final'",
      //         },
      //       },
      //     ],
      //   });
      //   expect(response.status).toBe(400);
      // });

      // it('returns invalid structure if the service request id is missing', async () => {
      //   // act
      //   const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/ImagingStudy`).send({
      //     resourceType: 'ImagingStudy',
      //     status: 'final',
      //     identifier: [
      //       {
      //         system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
      //         value: 'ACCESSION',
      //       },
      //     ],
      //     basedOn: [],
      //     note: [{ text: 'A note' }],
      //   });

      //   // assert
      //   expect(response.body).toMatchObject({
      //     resourceType: 'OperationOutcome',
      //     id: expect.any(String),
      //     issue: [
      //       {
      //         severity: 'error',
      //         code: 'structure',
      //         diagnostics: expect.any(String),
      //         details: {
      //           text: 'Need to have basedOn field that includes a Tamanu identifier',
      //         },
      //       },
      //     ],
      //   });
      //   expect(response.status).toBe(400);
      // });

      // it('returns invalid value if the service request cannot be found', async () => {
      //   const srId = fakeUUID();

      //   // act
      //   const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/ImagingStudy`).send({
      //     resourceType: 'ImagingStudy',
      //     status: 'final',
      //     identifier: [
      //       {
      //         system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
      //         value: 'ACCESSION',
      //       },
      //     ],
      //     basedOn: [
      //       {
      //         type: 'ServiceRequest',
      //         identifier: {
      //           system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
      //           value: srId,
      //         },
      //       },
      //     ],
      //     note: [{ text: 'A note' }],
      //   });

      //   // assert
      //   expect(response.body).toMatchObject({
      //     resourceType: 'OperationOutcome',
      //     id: expect.any(String),
      //     issue: [
      //       {
      //         severity: 'error',
      //         code: 'value',
      //         diagnostics: expect.any(String),
      //         details: {
      //           text: `ServiceRequest ${srId} does not exist in Tamanu`,
      //         },
      //       },
      //     ],
      //   });
      //   expect(response.status).toBe(400);
      // });
    });
  });

});
