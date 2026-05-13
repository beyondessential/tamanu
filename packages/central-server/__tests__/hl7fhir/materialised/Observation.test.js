import config from 'config';

import { LAB_REQUEST_STATUSES, FHIR_OBSERVATION_STATUS } from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import {
  ALL_FHIR_PERMISSIONS,
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
  fakeTestTypes,
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
    app = await ctx.baseApp.asNewRole(ALL_FHIR_PERMISSIONS);
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
        valueString: result,
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
        valueString: result,
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
    });

    it('post an Observation for a Labs ServiceRequest with panels', async () => {
      const result = '100';

      const { FhirServiceRequest, LabTest, LabTestType } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        true,
        {
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        },
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      const labTest = await LabTest.findOne({
        where: {
          labRequestId: labRequest.id,
        },
        include: [{ model: LabTestType, as: 'labTestType' }],
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
          coding: [
            {
              system: config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
              code: labTest.labTestType.code,
            },
          ],
        },
        valueString: result,
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
    });

    it('post an Observation with referenceRange updates labTest referenceRangeMin/Max', async () => {
      const result = '100';
      const referenceRangeMin = 5;
      const referenceRangeMax = 10;

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
        valueString: result,
        referenceRange: [
          {
            low: { value: referenceRangeMin },
            high: { value: referenceRangeMax },
          },
        ],
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
      expect(labTest.referenceRangeMin).toBe(referenceRangeMin);
      expect(labTest.referenceRangeMax).toBe(referenceRangeMax);
    });

    it('sets laboratoryOfficer from Observation.performer display when present', async () => {
      const result = '100';
      const performerDisplay = 'Dr FHIR Performer';

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
        valueString: result,
        performer: [
          {
            reference: 'Practitioner/example',
            display: performerDisplay,
          },
        ],
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
      expect(labTest.laboratoryOfficer).toBe(performerDisplay);
    });

    it('Will set lab test method on an existing lab test when Observation.method is provided', async () => {
      const result = '100';

      const { FhirServiceRequest, LabTest, LabTestType, ReferenceData } = ctx.store.models;
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
      const labTestMethod = await ReferenceData.create({
        code: 'FHIR_EXISTING_TEST_METHOD',
        name: 'FHIR Existing Test Method',
        type: 'labTestMethod',
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
        method: {
          coding: [
            {
              system: config.hl7.dataDictionaries.observationMethodCodeSystem,
              code: labTestMethod.code,
            },
          ],
        },
        valueString: result,
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
      expect(labTest.labTestMethodId).toBe(labTestMethod.id);
    });

    it('Will clear lab test method and reference range if omitted in a new Observation', async () => {
      const result = '100';

      const { FhirServiceRequest, LabTest, LabTestType, ReferenceData } = ctx.store.models;
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
      const labTestMethod = await ReferenceData.create({
        code: 'FHIR_CLEAR_TEST_METHOD',
        name: 'FHIR Clear Test Method',
        type: 'labTestMethod',
      });
      await labTest.update({
        labTestMethodId: labTestMethod.id,
        referenceRangeMin: 5,
        referenceRangeMax: 10,
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
        valueString: result,
        referenceRange: [],
      };

      const response = await app.post(endpoint).send(body);
      await labTest.reload();
      expect(response).toHaveSucceeded();
      expect(labTest.result).toBe(result);
      expect(labTest.labTestMethodId).toBeNull();
      expect(labTest.referenceRangeMin).toBeNull();
      expect(labTest.referenceRangeMax).toBeNull();
    });

    it('Will add a reflex test if the lab test code is not in the original request', async () => {
      const result = '100';

      const { FhirServiceRequest, LabTest, LabTestType } = ctx.store.models;
      const { labRequest, category } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        false,
        {
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        },
      );
      const [newTestType] = await fakeTestTypes(10, LabTestType, category.id);

      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;

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
              code: newTestType.code,
            },
          ],
        },
        valueString: result,
      };

      const response = await app.post(endpoint).send(body);
      expect(response).toHaveSucceeded();

      const labTest = await LabTest.findOne({
        include: [{ model: LabTestType, as: 'labTestType' }],
        where: {
          labRequestId: labRequest.id,
          '$labTestType.id$': newTestType.id,
        },
      });
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
          valueString: '100',
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

      it('returns invalid value if the Observation code does not match any test types', async () => {
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
          valueString: '100',
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
                text: expect.stringContaining(
                  `Cannot create reflex test, no lab test type found with code '${invalidCode}'`,
                ),
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });

      it('returns invalid value if Observation method does not contain a code in the configured method system', async () => {
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
        const testCode = mat.orderDetail[0];

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
                system === config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
            ),
          },
          method: {
            coding: [
              {
                system: 'http://example.org/alternate-method-system',
                code: 'RTPCR',
              },
            ],
          },
          valueString: '100',
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
                text: expect.stringContaining(
                  `Invalid method, must provide at least one coding with a code and system '${config.hl7.dataDictionaries.observationMethodCodeSystem}'`,
                ),
              },
            },
          ],
        });
        expect(response.status).toBe(400);
      });
    });
  });
});
