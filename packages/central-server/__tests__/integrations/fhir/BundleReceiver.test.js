import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
} from '../../fake/fhir';
import {
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { createTestContext } from '../../utilities';
import Chance from 'chance';

describe(`Testing Incoming Bundle Handlers`, () => {
  const chance = new Chance();
  let ctx;
  let app;
  let resources;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);
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
  });
  afterAll(() => ctx.close());
  describe('success', () => {

    it('handles a lims bundle', async () => {
      // arrange
      const { FhirServiceRequest } = ctx.store.models;

      const { labRequest, panelTestTypes, labTestPanel } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
        }
      );
      console.log({ labRequest, panelTestTypes, labTestPanel });
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;

      const filteredTests = panelTestTypes.filter(x => x.externalCode !== null);
      const randomTestInPanel =
        filteredTests[chance.integer({
          min: 0,
          max: filteredTests.length - 1,
        })];

      const validBundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              status: 'final',
              basedOn: [
                {
                  reference: `ServiceRequest/${serviceRequestId}` // this needs to be overwritten to work
                }
              ],
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: labTestPanel.externalCode,
                    display: labTestPanel.name,
                  }]
              },
              subject: {
                reference: `Patient/${resources.fhirPatient.id}`
              },
              result: [
                {
                  id: 'prothrombin-time',
                  reference: 'Observation/prothrombin-time'
                },
              ],
              presentedForm: [
                {
                  data: 'JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKP7/AFUAYgBlAHIpCi9DcmVhdG9yICj',
                  title: 'Full report attached',
                  contentType: 'application/pdf'
                }
              ]
            }
          },
          {
            resource: {
              resourceType: 'Observation',
              status: 'final',
              code: {
                coding: [[
                  {
                    system: 'http://loinc.org',
                    code: randomTestInPanel.externalCode,
                  }
                ]]
              },
              valueQuantity: { value: 25, unit: 'Seconds' },
              referenceRange: [{
                low: { value: 10, unit: 'Seconds' },
                high: { value: 13, unit: 'Seconds' }
              }],
              note: [{ text: 'Far exceeding limit' }]
            }
          }]
      };
      console.log({ body: JSON.stringify(validBundle) })

      const INTEGRATION_ROUTE = 'fhir/mat';
      const endpoint = `/v1/integration/${INTEGRATION_ROUTE}`;
      // act
      const response = await app.post(endpoint).send(validBundle);
      // assert
      expect(response).toHaveSucceeded();
    });

  });


  describe('failure', () => {
    test.todo('returns error if cannot match with any handlers');

  });
});

