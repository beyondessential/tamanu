import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
} from '../../fake/fhir';
import {
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { createTestContext } from '../../utilities';

describe(`Testing the Bundle Handlers`, () => {
  describe('success', () => {
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

    it('handles a bundle', async () => {
      const { FhirServiceRequest } = ctx.store.models;
      // arrange
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
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;

      const validBundle = {
        resourceType: 'Bundle',
        id: 'bundle-id',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              id: '9b3e1c8b-0adb-48c5-81e9-528b2ba40977',
              status: 'final',
              basedOn: [
                {
                  reference: `ServiceRequest/${serviceRequestId}` // this needs to be overwritten to work
                }
              ],
              category: [{
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                    code: 'HM',
                    display: 'Haematology'
                  }]
              }],
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '43153-6',
                    display: 'coagulation'
                  }], text: 'coagulation'
              },
              subject: {
                reference: `Patient/${resources.fhirPatient.id}`
              },
              issued: '2024-01-29T11:45:33+11:01',
              result: [
                {
                  id: 'prothrombin-time',
                  reference: 'Observation/prothrombin-time'
                },
              ],
              conclusion: 'Patient is on Warfarin',
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
              id: 'prothrombin-time',
              status: 'final',
              code: {
                coding: [[
                  {
                    system: 'http://loinc.org',
                    code: '42638-7',
                    display: 'Prothrombin Time'
                  }
                ]], text: 'Prothrombin Time'
              },
              subject: {
                display: 'Jack Bouma',
                reference: `Patient/${resources.fhirPatient.id}`
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

      const INTEGRATION_ROUTE = 'fhir/mat';
      const endpoint = `/v1/integration/${INTEGRATION_ROUTE}`;
      // act
      const response = await app.post(endpoint).send(validBundle);
      // assert
      expect(response).toHaveSucceeded();
    });

  });


  // describe('failure', () => {
  //   it('returns a 422 error when passed the wrong query params', async () => {
  //     // arrange
  //     const { Patient, PatientAdditionalData } = ctx.store.models;
  //     const patient = await Patient.create(fake(Patient));
  //     await PatientAdditionalData.create({
  //       ...fake(PatientAdditionalData),
  //       patientId: patient.id,
  //     });
  //     const id = encodeURIComponent(`not-the-right-identifier|${patient.displayId}`);
  //     const path = `/api/integration/${integrationName}/Patient?_sort=id&_page=z&_count=x&subject%3Aidentifier=${id}`;

  //     // act
  //     const response = await app.get(path).set(requestHeaders);

  //     // assert
  //     expect(response).toHaveRequestError(422);
  //     expect(response.body).toMatchObject({
  //       error: {
  //         errors: [
  //           'subject:identifier must be in the format "<namespace>|<id>"',
  //           '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
  //           '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
  //           'Unsupported or unknown parameters in _sort',
  //         ],
  //       },
  //     });
  //   });

  // });
});

