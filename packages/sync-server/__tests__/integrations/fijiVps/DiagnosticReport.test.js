import Chance from 'chance';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/integrations/fiji-vps/schema';

const chance = new Chance();

describe('VPS integration - DiagnosticReport', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  async function createLabTestHierarchy(patient, { isRDT = false } = {}) {
    const { LabTest, LabRequest, ReferenceData, LabTestType, Encounter, User } = ctx.store.models;

    const examiner = await User.create(fake(User));
    const encounter = await Encounter.create({
      ...fake(Encounter),
      patientId: patient.id,
      examinerId: examiner.id,
    });
    const laboratory = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'labTestLaboratory',
    });
    const labTestCategory = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'labTestCategory',
    });
    const labRequest = await LabRequest.create({
      ...fake(LabRequest),
      encounterId: encounter.id,
      labTestLaboratoryId: laboratory.id,
      labTestCategoryId: labTestCategory.id,
      status: 'published',
    });
    const labTestType = await LabTestType.create({
      ...fake(LabTestType),
      labTestCategoryId: labTestCategory.id,
      name: chance.pickone(
        isRDT
          ? [
              'AgRDT Negative, no further testing needed',
              'AgRDT Positve, no further testing needed',
            ]
          : [
              'COVID-19 Nasopharyngeal Swab',
              'COVID-19 Nasal Swab',
              'COVID-19 Oropharyngeal Swab',
              'COVID-19 Endotracheal aspirate',
            ],
      ),
    });
    const labTestMethod = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'labTestMethod',
    });
    const labTest = await LabTest.create({
      ...fake(LabTest),
      labTestTypeId: labTestType.id,
      labRequestId: labRequest.id,
      labTestMethodId: labTestMethod.id,
      categoryId: labTestCategory.id,
      result: 'Inconclusive',
    });

    return {
      labTest,
      labTestMethod,
      labTestType,
      labRequest,
      labTestCategory,
      laboratory,
      encounter,
      examiner,
    };
  }

  describe('success', () => {
    it('fetches a diagnostic report', async () => {
      // arrange
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const {
        examiner,
        labRequest,
        labTest,
        labTestMethod,
        labTestType,
        laboratory,
      } = await createLabTestHierarchy(patient);

      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Aresult`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'diagnostic-reports',
        meta: {
          lastUpdated: labTest.updatedAt.toISOString(),
        },
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
              resourceType: 'DiagnosticReport',
              id: labTest.id,
              effectiveDateTime: labRequest.sampleTime.toISOString(),
              issued: labRequest.requestedDate.toISOString(),
              code: {
                coding: [
                  {
                    code: labTestType.code,
                    display: labTestType.name,
                  },
                ],
                text: labTestType.name,
              },
              identifier: [
                {
                  system: 'http://tamanu.io/data-dictionary/labrequest-reference-number.html',
                  use: 'official',
                  value: labRequest.displayId,
                },
              ],
              performer: [
                {
                  display: laboratory.name,
                  reference: `Organization/${laboratory.id}`,
                },
                {
                  display: examiner.displayName,
                  reference: `Practitioner/${examiner.id}`,
                },
              ],
              status: 'final',
              result: [
                {
                  resourceType: 'Observation',
                  id: labTest.id,
                  status: 'final',
                  code: {
                    text:
                      'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Immunoassay',
                    coding: [
                      {
                        system: 'http://loinc.org',
                        code: '96119-3',
                        display:
                          'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Immunoassay',
                      },
                    ],
                  },
                  subject: {
                    display: `${patient.firstName} ${patient.lastName}`,
                    reference: `Patient/${patient.id}`,
                  },
                  valueCodeableConcept: {
                    coding: [
                      {
                        code: 'INC',
                        display: 'Inconclusive',
                        system:
                          'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                      },
                    ],
                  },
                },
              ],
              subject: {
                display: `${patient.firstName} ${patient.lastName}`,
                reference: `Patient/${patient.id}`,
              },
              extension: [
                {
                  url: 'http://tamanu.io/data-dictionary/covid-test-methods/covid-test-methods',
                  valueCodeableConcept: {
                    coding: [
                      {
                        code: labTestMethod.code,
                        display: labTestMethod.name,
                        system:
                          'http://tamanu.io/data-dictionary/covid-test-methods/covid-test-methods/rdt',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it('fetches multiple pages', async () => {
      // arrange
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const { labTest: labTest1 } = await createLabTestHierarchy(patient);
      const { labTest: labTest2 } = await createLabTestHierarchy(patient);
      const { labTest: labTest3 } = await createLabTestHierarchy(patient);

      const someOtherPatient = await Patient.create(fake(Patient)); // test no other records are retrieved
      await createLabTestHierarchy(someOtherPatient);
      await createLabTestHierarchy(someOtherPatient);

      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

      // act
      const response1 = await app.get(path);
      const nextUrl = response1.body.link.find(l => l.relation === 'next')?.url;
      const [, nextPath] = nextUrl.match(/^.*(\/v1\/integration\/fijiVps\/.*)$/);
      const response2 = await app.get(nextPath);

      // assert
      expect(response1).toHaveSucceeded();
      expect(response1.body).toMatchObject({
        total: 3,
        link: [
          { relation: 'self', url: expect.stringContaining(path) },
          {
            relation: 'next',
            url: expect.stringContaining('/v1/integration/fijiVps/DiagnosticReport?searchId='),
          },
        ],
        entry: [
          {
            resource: { id: labTest3.id },
          },
          {
            resource: { id: labTest2.id },
          },
        ],
      });
      expect(response2).toHaveSucceeded();
      expect(response2.body).toMatchObject({
        total: 3,
        link: [{ relation: 'self', url: nextUrl }],
        entry: [
          {
            resource: { id: labTest1.id },
          },
        ],
      });
    });

    it("returns no error but no results when subject:identifier doesn't match a patient", async () => {
      // arrange
      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|not-an-existing-id`);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'diagnostic-reports',
        meta: {
          lastUpdated: null,
        },
        type: 'searchset',
        total: 0,
        link: [
          {
            relation: 'self',
            url: expect.stringContaining(path),
          },
        ],
        entry: [],
      });
    });

    it('handles a lab request with no laboratory correctly', async () => {
      // arrange
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const { examiner, labRequest } = await createLabTestHierarchy(patient);
      await labRequest.reload();
      labRequest.labTestLaboratoryId = null; // remove the id
      await labRequest.save();

      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Aresult`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        entry: [
          {
            resource: {
              performer: [
                {
                  display: examiner.displayName,
                  reference: `Practitioner/${examiner.id}`,
                },
              ],
            },
          },
        ],
      });
    });

    it('handles RDTs correctly', async () => {
      // arrange
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const { labTest } = await createLabTestHierarchy(patient, { isRDT: true });

      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Aresult`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        entry: [
          {
            resource: {
              result: [
                {
                  resourceType: 'Observation',
                  id: labTest.id,
                  status: 'final',
                  code: {
                    text:
                      'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Rapid immunoassay',
                    coding: [
                      {
                        system: 'http://loinc.org',
                        code: '97097-0',
                        display:
                          'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Rapid immunoassay',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it('filters results by status=final', async () => {
      // arrange
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const { labTest: labTest1 } = await createLabTestHierarchy(patient);
      const { labRequest: labRequest2 } = await createLabTestHierarchy(patient);
      await labRequest2.reload();
      labRequest2.status = 'results_pending'; // set the status to something else
      await labRequest2.save();

      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        total: 1,
        entry: [
          {
            resource: { id: labTest1.id },
          },
        ],
      });
    });
  });

  describe('failure', () => {
    it('returns a 422 error when passed the wrong query params', async () => {
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      await createLabTestHierarchy(patient);

      const id = encodeURIComponent(`https://wrong.com/this-is-wrong|${patient.displayId}`);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=issued&_page=-1&_count=101&status=invalid-status&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Asomething-invalid`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        error: {
          errors: [
            'subject:identifier must be in the format "<namespace>|<id>"',
            '_count must be less than or equal to 20',
            '_page must be greater than or equal to 0',
            '_sort must be one of the following values: -issued',
            '_include must be one of the following values: DiagnosticReport:result',
            'status must be one of the following values: final',
          ],
        },
      });
    });

    it('returns a 422 error when passed no query params', async () => {
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      await createLabTestHierarchy(patient);

      const path = `/v1/integration/fijiVps/DiagnosticReport`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveRequestError(422);
      expect(response.body).toMatchObject({
        error: {
          errors: [
            'subject:identifier must be in the format "<namespace>|<id>"',
            'subject:identifier is a required field',
            '_page is a required field',
            '_sort is a required field',
          ],
        },
      });
    });
  });
});
