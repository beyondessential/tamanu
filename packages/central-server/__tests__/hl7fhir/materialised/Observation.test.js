import config from 'config';

import { LAB_REQUEST_STATUSES, FHIR_OBSERVATION_STATUS } from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
} from '../../fake/fhir';
import { v4 as uuidv4 } from 'uuid';

describe('Create Observation', () => {
  let ctx;
  let app;
  let resources;
  const fhirResources = {
    fhirPractitioner: null,
    fhirEncounter: null,
  };
  const INTEGRATION_ROUTE = 'fhir/mat';
  const endpoint = `/v1/integration/${INTEGRATION_ROUTE}/Observation`;

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

    it('post an Observation for a Labs ServiceRequest using the internal code system', async () => {
      const result = '100';

      const { FhirServiceRequest, LabTest, LabTestType } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        false,
        {
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        },
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();
      const testCode = mat.orderDetail[0];
      const labTest = await LabTest.findOne({
        include: [{ model: LabTestType, as: 'labTestType' }],
        where: {
          labRequestId: labRequest.id,
          '$labTestType.code$': testCode.coding.find(
            ({ system }) => system === config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
          )?.code,
        },
      });

      const body = {
        resourceType: 'Observation',
        basedOn: [
          {
            type: 'ServiceRequest',
            reference: `ServiceRequest/${serviceRequestId}`,
          },
        ],
        status: FHIR_OBSERVATION_STATUS.FINAL,
        code: {
          coding: testCode.coding.filter(
            ({ system }) => system === config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
          ),
        },
        value: {
          valueString: result,
        },
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
    });

    it('post an Observation for a Labs ServiceRequest using the external code system', async () => {
      const result = '100';

      const { FhirServiceRequest, LabTest, LabTestType } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        false,
        {
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        },
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();
      const testCode = mat.orderDetail[0];
      const labTest = await LabTest.findOne({
        include: [{ model: LabTestType, as: 'labTestType' }],
        where: {
          labRequestId: labRequest.id,
          '$labTestType.code$': testCode.coding.find(
            ({ system }) => system === config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
          )?.code,
        },
      });

      const body = {
        resourceType: 'Observation',
        basedOn: [
          {
            type: 'ServiceRequest',
            reference: `ServiceRequest/${serviceRequestId}`,
          },
        ],
        status: FHIR_OBSERVATION_STATUS.FINAL,
        code: {
          coding: testCode.coding.filter(
            ({ system }) =>
              system === config.hl7.dataDictionaries.serviceRequestLabTestExternalCodeSystem,
          ),
        },
        value: {
          valueString: result,
        },
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
    });

    describe('errors', () => {
      it('returns invalid value if the ServiceRequest does not exist', async () => {
        const nonExistentServiceRequestId = uuidv4();

        const body = {
          resourceType: 'Observation',
          basedOn: [
            {
              type: 'ServiceRequest',
              reference: `ServiceRequest/${nonExistentServiceRequestId}`,
            },
          ],
          status: FHIR_OBSERVATION_STATUS.FINAL,
          code: {
            coding: [
              {
                system: config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
                code: 'TEST_CODE',
              },
            ],
          },
          value: {
            valueString: '100',
          },
        };

        const response = await app.post(endpoint).send(body);

        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'value',
              diagnostics: expect.any(String),
              details: {
                text: `ServiceRequest '${nonExistentServiceRequestId}' does not exist in Tamanu`,
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('returns invalid value if the Observation code does not match any test in the ServiceRequest', async () => {
        const { FhirServiceRequest } = ctx.store.models;
        const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
          ctx.store.models,
          resources,
          false,
          {
            status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
          },
        );
        const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const serviceRequestId = mat.id;
        await FhirServiceRequest.resolveUpstreams();

        // Use a code that doesn't exist in the ServiceRequest
        const invalidCode = 'INVALID_CODE_THAT_DOES_NOT_EXIST';

        const body = {
          resourceType: 'Observation',
          basedOn: [
            {
              type: 'ServiceRequest',
              reference: `ServiceRequest/${serviceRequestId}`,
            },
          ],
          status: FHIR_OBSERVATION_STATUS.FINAL,
          code: {
            coding: [
              {
                system: config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
                code: invalidCode,
              },
            ],
          },
          value: {
            valueString: '100',
          },
        };

        const response = await app.post(endpoint).send(body);

        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'value',
              diagnostics: expect.any(String),
              details: {
                text: expect.stringContaining(`No LabTest with code: '${invalidCode}' found for LabRequest: '${labRequest.id}'`),
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });
    });
  });
});
