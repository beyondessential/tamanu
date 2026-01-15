import config from 'config';

import { LAB_REQUEST_STATUSES, FHIR_OBSERVATION_STATUS } from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
} from '../../fake/fhir';

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

    describe('errors', () => {});
  });
});
