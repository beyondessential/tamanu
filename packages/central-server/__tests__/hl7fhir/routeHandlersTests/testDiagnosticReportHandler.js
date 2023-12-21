import { convertISO9075toRFC3339 } from '@tamanu/shared/utils/dateTime';
import { fake, chance } from '@tamanu/shared/test-helpers';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/hl7fhir/utils';

export function testDiagnosticReportHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} integration - DiagnosticReport`, () => {
    let ctx;
    let app;
    beforeAll(async () => {
      ctx = await createTestContext(requestHeaders['X-Tamanu-Client']);
      app = await ctx.baseApp.asRole('practitioner');
    });
    afterAll(() => ctx.close());

    async function createLabTestHierarchy(patient, { isRDT = false } = {}) {
      const {
        Department,
        Facility,
        LabTest,
        LabRequest,
        Location,
        ReferenceData,
        LabTestType,
        Encounter,
        User,
      } = ctx.store.models;

      const facility = await Facility.create({
        ...fake(Facility),
        name: 'Utopia HQ',
      });

      const location = await Location.create({
        ...fake(Location),
        facilityId: facility.id,
      });

      const department = await Department.create({
        ...fake(Department),
        facilityId: facility.id,
      });

      const examiner = await User.create(fake(User));

      const encounter = await Encounter.create({
        ...fake(Encounter),
        patientId: patient.id,
        examinerId: examiner.id,
        locationId: location.id,
        departmentId: department.id,
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
            ? ['AgRDT Negative, no further testing needed', 'AgRDT Positive']
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
        code: isRDT ? 'RDT' : chance.pickone(['GeneXpert', 'RTPCR']),
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
        const path = `/v1/integration/${integrationName}/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Aresult&_include=DiagnosticReport%3Aresult.device%3ADevice`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'diagnostic-reports',
          meta: {
            lastUpdated: labTest.updatedAt.toISOString(),
          },
          type: 'searchset',
          timestamp: expect.any(String),
          total: 1,
          link: [
            {
              relation: 'self',
              url: expect.stringContaining(path),
            },
          ],
          entry: [
            {
              fullUrl: expect.stringContaining(labTest.id),
              resource: {
                resourceType: 'DiagnosticReport',
                id: labTest.id,
                effectiveDateTime: convertISO9075toRFC3339(labRequest.sampleTime),
                issued: convertISO9075toRFC3339(labRequest.requestedDate),
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
                result: [{ reference: `Observation/${labTest.id}` }],
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
            {
              resource: {
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
                device: {
                  reference: `Device/${labTestMethod.id}`,
                  display: expect.toBeOneOf([
                    'COVID Gene-Xpert Testing Device',
                    'COVID RT-PCR Testing Device',
                  ]),
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
            },
            {
              resource: {
                resourceType: 'Device',
                id: labTestMethod.id,
                text: expect.toBeOneOf([
                  'COVID Gene-Xpert Testing Device',
                  'COVID RT-PCR Testing Device',
                ]),
                manufacturer: expect.toBeOneOf(['Cepheid', 'TIB MOLBIOL']),
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
        const path = `/v1/integration/${integrationName}/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

        // act
        const response1 = await app.get(path).set(requestHeaders);

        const nextUrl = response1.body.link.find(l => l.relation === 'next')?.url;
        const urlRegEx = new RegExp(`^.*(/v1/integration/${integrationName}/.*)$`);
        const [, nextPath] = nextUrl.match(urlRegEx);
        const response2 = await app.get(nextPath).set(requestHeaders);

        // assert
        expect(response1).toHaveSucceeded();
        expect(response1.body).toMatchObject({
          total: 3,
          link: [
            { relation: 'self', url: expect.stringContaining(path) },
            {
              relation: 'next',
              url: expect.stringContaining(
                `/v1/integration/${integrationName}/DiagnosticReport?searchId=`,
              ),
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
        const path = `/v1/integration/${integrationName}/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'diagnostic-reports',
          meta: {
            lastUpdated: null,
          },
          type: 'searchset',
          timestamp: expect.any(String),
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
        const path = `/v1/integration/${integrationName}/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Aresult&_include=DiagnosticReport%3Aresult.device%3ADevice`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toMatchObject({
          entry: [
            {
              resource: {
                resourceType: 'DiagnosticReport',
                performer: [
                  {
                    display: examiner.displayName,
                    reference: `Practitioner/${examiner.id}`,
                  },
                ],
              },
            },
            {
              resource: {
                resourceType: 'Observation',
              },
            },
            {
              resource: {
                resourceType: 'Device',
              },
            },
          ],
        });
      });

      it('handles RDTs correctly', async () => {
        // arrange
        const { Patient } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        const { labTest, labTestMethod } = await createLabTestHierarchy(patient, { isRDT: true });

        const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
        const path = `/v1/integration/${integrationName}/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Aresult&_include=DiagnosticReport%3Aresult.device%3ADevice`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toMatchObject({
          entry: [
            {
              resource: {
                result: [{ reference: `Observation/${labTest.id}` }],
              },
            },
            {
              resource: {
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
            },
            {
              resource: {
                id: labTestMethod.id,
                resourceType: 'Device',
                manufacturer: 'Unknown',
                text: 'Unknown',
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
        const path = `/v1/integration/${integrationName}/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

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
        const path = `/v1/integration/${integrationName}/DiagnosticReport?_sort=deceased&_page=-1&_count=101&status=invalid-status&subject%3Aidentifier=${id}&_include=DiagnosticReport%3Asomething-invalid`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: [
              'subject:identifier must be in the format "<namespace>|<id>"',
              '_count must be less than or equal to 20',
              '_page must be greater than or equal to 0',
              '_sort must be one of the following values: -issued, issued',
              'status must be one of the following values: final',
              '_include[0] must be one of the following values: DiagnosticReport:result, DiagnosticReport:result.device:Device',
            ],
          },
        });
      });

      it('returns a 422 error when passed no query params', async () => {
        const { Patient } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await createLabTestHierarchy(patient);

        const path = `/v1/integration/${integrationName}/DiagnosticReport`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: ['subject:identifier is a required field'],
          },
        });
      });
    });
  });
}
