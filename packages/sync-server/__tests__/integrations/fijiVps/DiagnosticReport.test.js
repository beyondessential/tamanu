import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/integrations/fiji-vps/schema';

describe('VPS integration - DiagnosticReport', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  async function createLabTestHierarchy(patient) {
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
    });
    const labTestType = await LabTestType.create({
      ...fake(LabTestType),
      labTestCategoryId: labTestCategory.id,
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
      status: 'published',
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
            link: expect.stringContaining(path),
          },
        ],
        entry: [
          {
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
                code: {},
                subject: {
                  display: `${patient.firstName} ${patient.lastName}`,
                  reference: `Patient/${patient.id}`,
                },
                valueCodeableConcept: {
                  coding: [
                    {
                      code: 'INC',
                      display: 'Inconclusive',
                      system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
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
      const nextUrl = response1.body.link.find(l => l.relation === 'next')?.link;
      const [, nextPath] = nextUrl.match(/^.*(\/v1\/integration\/fijiVps\/.*)$/);
      const response2 = await app.get(nextPath);

      // assert
      expect(response1).toHaveSucceeded();
      expect(response1.body).toMatchObject({
        total: 3,
        link: [
          { relation: 'self', link: expect.stringContaining(path) },
          {
            relation: 'next',
            link: expect.stringContaining('/v1/integration/fijiVps/DiagnosticReport?searchId='),
          },
        ],
        entry: [{ id: labTest3.id }, { id: labTest2.id }],
      });
      expect(response2).toHaveSucceeded();
      expect(response2.body).toMatchObject({
        total: 3,
        link: [{ relation: 'self', link: nextUrl }],
        entry: [{ id: labTest1.id }],
      });
    });
  });

  describe('failure', () => {
    it('returns an error when passed the wrong query params', async () => {
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
            'status must be one of the following values: final',
            '_count must be less than or equal to 20',
            '_page must be greater than or equal to 0',
            '_sort must be one of the following values: -issued',
            '_include must be one of the following values: DiagnosticReport:result',
          ],
        },
      });
    });
  });
});
