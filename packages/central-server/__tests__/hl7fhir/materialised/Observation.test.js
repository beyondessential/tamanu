/* eslint-disable no-unused-expressions */
import {
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import Chance from 'chance';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
} from '../../fake/fhir';

describe('Parse Observation Results', () => {
  const chance = new Chance();
  let ctx;
  let app;
  let resources;
  const fhirResources = {
    fhirPractitioner: null,
    fhirEncounter: null,
  };
  const INTEGRATION_ROUTE = 'fhir/mat';
  const endpoint = `/v1/integration/${INTEGRATION_ROUTE}/Observation`;
  const postBody = (serviceRequestId, testCode) => ({
    resourceType: 'Observation',
    status: 'final',
    id: 'activated-partial-thromboplastin-time',
    basedOn: [
      {
        reference: `ServiceRequest/${serviceRequestId}`
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: testCode,
          display: 'Activated Partial Thromboplastin Time'
        }
      ],
      text: 'Activated Partial Thromboplastin Time'
    },
    valueQuantity: {
      value: 30,
      unit: 'Seconds'
    },
    referenceRange: [
      {
        low: {
          value: 25,
          unit: 'Seconds'
        },
        high: {
          value: 35,
          unit: 'Seconds'
        }
      }
    ],
    note: [
      {
        text: 'Within limits'
      }
    ]
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

  describe('success', () => {
    beforeEach(async () => {
      const {
        FhirServiceRequest,
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
        FhirEncounter,
      } = ctx.store.models;
      await FhirEncounter.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });
      const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
      fhirResources.fhirEncounter = fhirEncounter;
    });

    it('Receive Observation for test in existing Service Request', async () => {
      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest, panelTestTypes } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
        }
      );

      // We can't use external codes that don't exist unfortuantely
      const filteredTests = panelTestTypes.filter(x => x.externalCode !== null);
      const randomTestInPanel = 
      filteredTests[chance.integer({
        min: 0,
        max: filteredTests.length - 1,
      })];
      console.log({ filteredTests: filteredTests.map(x => x.externalCode ) });
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      const body = postBody(serviceRequestId, randomTestInPanel.externalCode);
      const response = await app.post(endpoint).send(body);
      console.log({ response });
      await labRequest.reload();
      expect(response).toHaveSucceeded();
    });

    test.todo('Receive Observation for test in Service Request using internal coding')
    test.todo('Receive Observation for new test in Service Request')

    // describe('errors', () => {
    //   it('error if attach a diagnosticReport to an ImagingRequest', async () => {
    //     const { FhirServiceRequest } = ctx.store.models;
    //     const imagingRequest = await fakeResourcesOfFhirServiceRequestWithImagingRequest(
    //       ctx.store.models,
    //       resources,
    //     );
    //     const mat = await FhirServiceRequest.materialiseFromUpstream(imagingRequest.id);
    //     const serviceRequestId = mat.id;
    //     await FhirServiceRequest.resolveUpstreams();

    //     const body = postBody(serviceRequestId);
    //     const response = await app.post(endpoint).send(body);
    //     expect(response.body).toMatchObject({
    //       resourceType: 'OperationOutcome',
    //       id: expect.any(String),
    //       issue: [
    //         {
    //           severity: 'error',
    //           code: 'invalid',
    //           diagnostics: expect.any(String),
    //           details: {
    //             text: `No LabRequest with id: '${imagingRequest.id}', might be ImagingRequest id`,
    //           },
    //         },
    //       ],
    //     });
    //     expect(response.status).toBe(400);
    //   });

    //   it('returns invalid if the resourceType does not match', async () => {
    //     const { FhirServiceRequest } = ctx.store.models;
    //     const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
    //       ctx.store.models,
    //       resources,
    //       {
    //         isWithPanels: true,
    //       },
    //       {
    //         status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
    //       }
    //     );
    //     const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
    //     const serviceRequestId = mat.id;
    //     await FhirServiceRequest.resolveUpstreams();

    //     const body = postBody(serviceRequestId);
    //     body.resourceType = 'Patient';
    //     const response = await app.post(endpoint).send(body);
    //     expect(response.body).toMatchObject({
    //       resourceType: 'OperationOutcome',
    //       id: expect.any(String),
    //       issue: [
    //         {
    //           severity: 'error',
    //           code: 'invalid',
    //           diagnostics: expect.any(String),
    //           details: {
    //             text: "must be 'Observation'",
    //           },
    //         },
    //       ],
    //     });
    //     expect(response.status).toBe(400);
    //   });


    //   it('reports invalid if using invalid statuses', async () => {
    //     const { FhirServiceRequest } = ctx.store.models;
    //     const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
    //       ctx.store.models,
    //       resources,
    //       {
    //         isWithPanels: true,
    //       },
    //       {
    //         status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
    //       }
    //     );
    //     const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
    //     const serviceRequestId = mat.id;
    //     await FhirServiceRequest.resolveUpstreams();
    //     const body = postBody(serviceRequestId);


    //     body.status = 'unstatus';
    //     const response = await app.post(endpoint).send(body);

    //     expect(response.body).toMatchObject({
    //       resourceType: 'OperationOutcome',
    //       id: expect.any(String),
    //       issue: [
    //         {
    //           severity: 'error',
    //           code: 'invalid',
    //           diagnostics: expect.any(String),
    //           details: {
    //             text: "'unstatus' is an invalid ServiceRequest status",
    //           },
    //         },
    //       ],
    //     });
    //     expect(response.status).toBe(400);
    //   });

    //   it('returns invalid structure if the service request id is missing', async () => {
    //     const { FhirServiceRequest } = ctx.store.models;
    //     const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
    //       ctx.store.models,
    //       resources,
    //       {
    //         isWithPanels: true,
    //       },
    //       {
    //         status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
    //       }
    //     );
    //     const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
    //     const serviceRequestId = mat.id;
    //     await FhirServiceRequest.resolveUpstreams();
    //     const body = postBody(serviceRequestId);
    //     delete body.basedOn;
    //     const response = await app.post(endpoint).send(body);
    //     expect(response.body).toMatchObject({
    //       resourceType: 'OperationOutcome',
    //       id: expect.any(String),
    //       issue: [
    //         {
    //           severity: 'error',
    //           code: 'invalid',
    //           diagnostics: expect.any(String),
    //           details: {
    //             text: 'basedOn is a required field',
    //           },
    //         },
    //       ],
    //     });
    //     expect(response.status).toBe(400);
    //   });
    // });
  });

});
