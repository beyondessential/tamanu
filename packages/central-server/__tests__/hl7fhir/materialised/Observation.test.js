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
import { fake } from '@tamanu/shared/test-helpers';
import config from 'config';

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
  const postBody = (serviceRequestId, value, testCode, testCodeSystem = 'http://loinc.org') => ({
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
          system: testCodeSystem,
          code: testCode,
          display: 'Activated Partial Thromboplastin Time'
        }
      ],
      text: 'Activated Partial Thromboplastin Time'
    },
    valueQuantity: {
      value: value,
      unit: 'units'
    },
    referenceRange: [
      {
        low: {
          value: 25,
          unit: 'units'
        },
        high: {
          value: 35,
          unit: 'units'
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
        LabTest,
        LabTestType,
        LabTestPanel,
        LabTestPanelLabTestTypes,
        LabTestPanelRequest,
        FhirEncounter,
      } = ctx.store.models;
      await FhirEncounter.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTest.destroy({ where: {} });
      await LabTestType.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelLabTestTypes.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });
      const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
      fhirResources.fhirEncounter = fhirEncounter;
    });

    it('Receive Observation for test in existing Service Request', async () => {
      // arrange
      const { FhirServiceRequest, LabTest } = ctx.store.models;
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
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      const value = chance.integer({
        min: 0,
        max: 10000,
      });

      const body = postBody(serviceRequestId, value, randomTestInPanel.externalCode);

      // act
      const response = await app.post(endpoint).send(body);

      // assert
      const labTest = await LabTest.findOne({
        where: {
          labRequestId: labRequest.id,
          labTestTypeId: randomTestInPanel.id,
        }
      })
      expect(labTest.result).toBe(value.toString());
      expect(response).toHaveSucceeded();
    });

    it('Receive Observation for test in Service Request using internal coding', async () => {
      // arrange
      const { FhirServiceRequest, LabTest } = ctx.store.models;
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
      const randomTestInPanel =
        panelTestTypes[chance.integer({
          min: 0,
          max: panelTestTypes.length - 1,
        })];
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      const value = chance.integer({
        min: 0,
        max: 10000,
      });

      const body = postBody(
        serviceRequestId,
        value,
        randomTestInPanel.code,
        config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem, // use internal
      );

      // act
      const response = await app.post(endpoint).send(body);

      // assert
      const labTest = await LabTest.findOne({
        where: {
          labRequestId: labRequest.id,
          labTestTypeId: randomTestInPanel.id,
        }
      })
      expect(labTest.result).toBe(value.toString());
      expect(response).toHaveSucceeded();
    });

    it('Receive Observation for new test not in original Service Request', async () => {
      // arrange
      const { FhirServiceRequest, LabTest, LabTestType } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
        }
      );
      const newLabTestType = await LabTestType.create({
        ...fake(LabTestType),
        labTestCategoryId: labRequest.labTestCategoryId,
        externalCode: 'zoomRightToTheMoon',
      });
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();
      const value = chance.integer({
        min: 0,
        max: 10000,
      });
      const body = postBody(serviceRequestId, value, newLabTestType.externalCode);

      // act
      const response = await app.post(endpoint).send(body);

      // assert
      const labTest = await LabTest.findOne({
        where: {
          labRequestId: labRequest.id,
          labTestTypeId: newLabTestType.id,
        }
      });
      expect(labTest.result).toBe(value.toString());
      expect(response).toHaveSucceeded();
    });



    test.todo('Receive Observation for string valued result')
    test.todo('Receive Observation for boolean valued result')
    test.todo('Receive Observation for number valued result')

    describe('errors', () => {
      test.todo('Receive Observation for with multiple results of different types')
      test.todo('Receive Observation for with no results')
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

    });
  });

});
