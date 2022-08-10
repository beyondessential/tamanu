import Chance from 'chance';
import { format } from 'date-fns';
import moment from 'moment';

import { convertISO9075toRFC3339 } from 'shared/utils/dateTime';
import { fake, fakeReferenceData, fakeUser } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { IDENTIFIER_NAMESPACE } from '../../app/hl7fhir/utils';

/*
  The HL7 FHIR functionality is re-used across multiple integrations
  (fijiVps, mSupply and fhir). Since they all share the same route handler,
  they will do pretty much the same and should share the same tests.
*/

export function testDiagnosticReportHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} integration - DiagnosticReport`, () => {
    const chance = new Chance();
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

export function testPatientHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} integration - Patient`, () => {
    let ctx;
    let app;
    beforeAll(async () => {
      ctx = await createTestContext();
      app = await ctx.baseApp.asRole('practitioner');
    });
    afterAll(() => ctx.close());

    describe('success', () => {
      it('fetches a patient', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient, { dateOfDeath: new Date() }));
        const additionalData = await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        await patient.reload(); // saving PatientAdditionalData updates the patient too
        const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'patients',
          meta: {
            lastUpdated: patient.updatedAt.toISOString(),
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
              active: true,
              address: [
                {
                  city: additionalData.cityTown,
                  line: [additionalData.streetVillage],
                  type: 'physical',
                  use: 'home',
                },
              ],
              birthDate: format(patient.dateOfBirth, 'yyyy-MM-dd'),
              deceasedDateTime: format(patient.dateOfDeath, "yyyy-MM-dd'T'HH:mm:ssXXX"),
              gender: patient.sex,
              id: patient.id,
              identifier: [
                {
                  assigner: 'Tamanu',
                  system: 'http://tamanu.io/data-dictionary/application-reference-number.html',
                  use: 'usual',
                  value: patient.displayId,
                },
                {
                  assigner: 'RTA',
                  use: 'secondary',
                  value: additionalData.drivingLicense,
                },
              ],
              name: [
                {
                  family: patient.lastName,
                  given: [patient.firstName, patient.middleName],
                  prefix: [additionalData.title],
                  use: 'official',
                },
                {
                  text: patient.culturalName,
                  use: 'nickname',
                },
              ],
              resourceType: 'Patient',
              telecom: [
                {
                  rank: 1,
                  value: additionalData.primaryContactNumber,
                },
                {
                  rank: 2,
                  value: additionalData.secondaryContactNumber,
                },
              ],
            },
          ],
        });
      });

      it("returns no error but no results when subject:identifier doesn't match a patient", async () => {
        // arrange
        const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|abc123-not-real`);
        const path = `/v1/integration/${integrationName}/Patient?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'patients',
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

      it('returns a list of patients when passed no query params', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        const path = `/v1/integration/${integrationName}/Patient`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });
    });

    describe('sorts correctly', () => {
      beforeEach(async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });
      });

      it('sorts by firstName ascending (given)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { firstName: 'Alice' })),
          Patient.create(fake(Patient, { firstName: 'Bob' })),
          Patient.create(fake(Patient, { firstName: 'Charlie' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=given`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].given[0]).toBe('Alice');
        expect(response.body.entry[1].name[0].given[0]).toBe('Bob');
        expect(response.body.entry[2].name[0].given[0]).toBe('Charlie');
      });

      it('sorts by firstName descending (-given)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { firstName: 'Alice' })),
          Patient.create(fake(Patient, { firstName: 'Bob' })),
          Patient.create(fake(Patient, { firstName: 'Charlie' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-given`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].given[0]).toBe('Charlie');
        expect(response.body.entry[1].name[0].given[0]).toBe('Bob');
        expect(response.body.entry[2].name[0].given[0]).toBe('Alice');
      });

      it('sorts by lastName ascending (family)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { lastName: 'Adams' })),
          Patient.create(fake(Patient, { lastName: 'Brown' })),
          Patient.create(fake(Patient, { lastName: 'Carter' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=family`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].family).toBe('Adams');
        expect(response.body.entry[1].name[0].family).toBe('Brown');
        expect(response.body.entry[2].name[0].family).toBe('Carter');
      });

      it('sorts by lastName descending (-family)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { lastName: 'Adams' })),
          Patient.create(fake(Patient, { lastName: 'Brown' })),
          Patient.create(fake(Patient, { lastName: 'Carter' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-family`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].name[0].family).toBe('Carter');
        expect(response.body.entry[1].name[0].family).toBe('Brown');
        expect(response.body.entry[2].name[0].family).toBe('Adams');
      });

      it('sorts by dateOfBirth ascending (birthdate)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth: moment('1984-10-20') })),
          Patient.create(fake(Patient, { dateOfBirth: moment('1985-02-20') })),
          Patient.create(fake(Patient, { dateOfBirth: moment('1985-03-20') })),
          Patient.create(fake(Patient, { dateOfBirth: moment('1985-03-21') })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=birthdate`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(4);
        expect(response.body.entry[0].birthDate).toBe('1984-10-20');
        expect(response.body.entry[1].birthDate).toBe('1985-02-20');
        expect(response.body.entry[2].birthDate).toBe('1985-03-20');
        expect(response.body.entry[3].birthDate).toBe('1985-03-21');
      });

      it('sorts by dateOfBirth descending (-birthdate)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth: moment('1984-10-20') })),
          Patient.create(fake(Patient, { dateOfBirth: moment('1985-02-20') })),
          Patient.create(fake(Patient, { dateOfBirth: moment('1985-03-20') })),
          Patient.create(fake(Patient, { dateOfBirth: moment('1985-03-21') })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-birthdate`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(4);
        expect(response.body.entry[0].birthDate).toBe('1985-03-21');
        expect(response.body.entry[1].birthDate).toBe('1985-03-20');
        expect(response.body.entry[2].birthDate).toBe('1985-02-20');
        expect(response.body.entry[3].birthDate).toBe('1984-10-20');
      });

      it('sorts by additionalData.cityTown ascending (address)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=address`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Amsterdam');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Cabo');
      });

      it('sorts by additionalData.cityTown descending (-address)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-address`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Cabo');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Amsterdam');
      });

      it('sorts by additionalData.cityTown ascending (address-city)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=address-city`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Amsterdam');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Cabo');
      });

      it('sorts by additionalData.cityTown descending (-address-city)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Amsterdam' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Berlin' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'Cabo' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-address-city`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].address[0].city).toBe('Cabo');
        expect(response.body.entry[1].address[0].city).toBe('Berlin');
        expect(response.body.entry[2].address[0].city).toBe('Amsterdam');
      });

      it('sorts by additionalData.primaryContactNumber ascending (telecom)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456781' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456782' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456783' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=telecom`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].telecom[0].value).toBe('123456781');
        expect(response.body.entry[1].telecom[0].value).toBe('123456782');
        expect(response.body.entry[2].telecom[0].value).toBe('123456783');
      });

      it('sorts by additionalData.primaryContactNumber descending (-telecom)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456781' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456782' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456783' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?_sort=-telecom`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(3);
        expect(response.body.entry[0].telecom[0].value).toBe('123456783');
        expect(response.body.entry[1].telecom[0].value).toBe('123456782');
        expect(response.body.entry[2].telecom[0].value).toBe('123456781');
      });

      it('sorts by multiple fields', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree, patientFour, patientFive] = await Promise.all([
          Patient.create(fake(Patient, { firstName: 'Alice', lastName: 'Adams' })),
          Patient.create(fake(Patient, { firstName: 'Alice', lastName: 'Adams' })),
          Patient.create(fake(Patient, { firstName: 'Alice', lastName: 'Baker' })),
          Patient.create(fake(Patient, { firstName: 'Bob', lastName: 'Adams' })),
          Patient.create(fake(Patient, { firstName: 'Bob', lastName: 'Baker' })),
        ]);

        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456781' }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456782' }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456783' }),
            patientId: patientThree.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456784' }),
            patientId: patientFour.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '123456785' }),
            patientId: patientFive.id,
          }),
        ]);

        // Sort by firstName ascending, lastName descending, primaryContactNumber ascending
        const path = `/v1/integration/${integrationName}/Patient?_sort=given,-family,telecom`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(5);
        // Numbers don't repeat so everything else should be in place
        expect(response.body.entry[0].telecom[0].value).toBe('123456783');
        expect(response.body.entry[1].telecom[0].value).toBe('123456781');
        expect(response.body.entry[2].telecom[0].value).toBe('123456782');
        expect(response.body.entry[3].telecom[0].value).toBe('123456785');
        expect(response.body.entry[4].telecom[0].value).toBe('123456784');
      });
    });

    describe('filters search', () => {
      beforeEach(async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        await Patient.destroy({ where: {} });
        await PatientAdditionalData.destroy({ where: {} });
      });

      it('filters patient by displayId (identifier)', async () => {
        const { Patient } = ctx.store.models;
        const [patientOne] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const identifier = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patientOne.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?identifier=${identifier}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(1);
      });

      it('filters patients by firstName (given)', async () => {
        const { Patient } = ctx.store.models;
        const firstName = 'John';
        await Promise.all([
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName: 'Bob' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?given=${firstName}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by lastName (family)', async () => {
        const { Patient } = ctx.store.models;
        const lastName = 'Doe';
        await Promise.all([
          Patient.create(fake(Patient, { lastName })),
          Patient.create(fake(Patient, { lastName })),
          Patient.create(fake(Patient, { lastName: 'Gray' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?family=${lastName}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by sex (gender)', async () => {
        const { Patient } = ctx.store.models;
        const sex = 'other';
        await Promise.all([
          Patient.create(fake(Patient, { sex })),
          Patient.create(fake(Patient, { sex })),
          Patient.create(fake(Patient, { sex: 'female' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?gender=${sex}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by dateOfBirth (birthdate)', async () => {
        const { Patient } = ctx.store.models;
        const dateString = '1990-05-25';
        const dateOfBirth = moment.utc(dateString);
        await Promise.all([
          Patient.create(fake(Patient, { dateOfBirth })),
          Patient.create(fake(Patient, { dateOfBirth })),
          Patient.create(fake(Patient, { dateOfBirth: moment.utc('1985-10-20') })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?birthdate=${dateString}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by being deceased or not (deceased)', async () => {
        const { Patient } = ctx.store.models;
        await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient, { dateOfDeath: moment.utc() })),
        ]);

        // Query deceased=true
        const pathTrue = `/v1/integration/${integrationName}/Patient?deceased=true`;
        const responseTrue = await app.get(pathTrue).set(requestHeaders);

        expect(responseTrue).toHaveSucceeded();
        expect(responseTrue.body.total).toBe(1);

        // Query deceased=false
        const pathFalse = `/v1/integration/${integrationName}/Patient?deceased=false`;
        const responseFalse = await app.get(pathFalse).set(requestHeaders);

        expect(responseFalse).toHaveSucceeded();
        expect(responseFalse.body.total).toBe(2);
      });

      it('filters patients by additionalData.cityTown (address-city)', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const cityTown = 'luxembourg';
        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'quito' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?address-city=${cityTown}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      test.todo('filtering by address looks up a bunch of fields');
      test.todo('filtering by telecom looks up a bunch of fields');

      // This test can be replaced after address is able to look up several fields
      it('filtering by address only looks up additionalData.cityTown', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const cityTown = 'luxembourg';
        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { cityTown: 'quito' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?address=${cityTown}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      // This test can be replaced after telecom is able to look up several fields
      it('filtering by telecom only looks up additionalData.primaryContactNumber', async () => {
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const [patientOne, patientTwo, patientThree] = await Promise.all([
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
          Patient.create(fake(Patient)),
        ]);

        const primaryContactNumber = '123456789';
        await Promise.all([
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber }),
            patientId: patientOne.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber }),
            patientId: patientTwo.id,
          }),
          PatientAdditionalData.create({
            ...fake(PatientAdditionalData, { primaryContactNumber: '987654321' }),
            patientId: patientThree.id,
          }),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?telecom=${primaryContactNumber}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by params with supported modifiers', async () => {
        const { Patient } = ctx.store.models;
        const firstName = 'Jane';
        await Promise.all([
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName })),
          Patient.create(fake(Patient, { firstName: 'Alice' })),
        ]);

        const path = `/v1/integration/${integrationName}/Patient?given:contains=${firstName.slice(
          1,
          3,
        )}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });

      it('filters patients by combining params and modifiers (all need to match)', async () => {
        const { Patient } = ctx.store.models;
        const firstName = 'Jane';
        const lastName = 'Doe';
        const dateString = '1990-05-20';
        const dateOfBirth = moment.utc(dateString);
        await Promise.all([
          Patient.create(fake(Patient, { firstName, lastName, dateOfBirth })),
          Patient.create(fake(Patient, { firstName, lastName, dateOfBirth })),
          Patient.create(fake(Patient, { firstName: 'Alice', lastName, dateOfBirth })),
        ]);

        const slicedName = firstName.slice(1, 3);
        const path = `/v1/integration/${integrationName}/Patient?given:contains=${slicedName}&family=${lastName}&birthdate=${dateString}`;
        const response = await app.get(path).set(requestHeaders);

        expect(response).toHaveSucceeded();
        expect(response.body.total).toBe(2);
      });
    });

    describe('failure', () => {
      it('returns a 422 error when passed the wrong query params', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        const id = encodeURIComponent(`not-the-right-identifier|${patient.displayId}`);
        const path = `/v1/integration/${integrationName}/Patient?_sort=id&_page=z&_count=x&subject%3Aidentifier=${id}`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: [
              'subject:identifier must be in the format "<namespace>|<id>"',
              '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
              '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
              'Unsupported or unknown parameters in _sort',
            ],
          },
        });
      });

      it('returns a 422 if there are any unknown patient params', async () => {
        // arrange
        const { Patient, PatientAdditionalData } = ctx.store.models;
        const patient = await Patient.create(fake(Patient));
        await PatientAdditionalData.create({
          ...fake(PatientAdditionalData),
          patientId: patient.id,
        });
        const path = `/v1/integration/${integrationName}/Patient?whatever=something`;

        // act
        const response = await app.get(path).set(requestHeaders);

        // assert
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: ['Unknown or unsupported parameters: whatever'],
          },
        });
      });
    });
  });
}

export function testImmunizationHandler(integrationName, requestHeaders = {}) {
  describe(`${integrationName} integration - Immunization`, () => {
    let ctx;
    let app;
    let models;

    const NON_SUPPORTED_VACCINE_ID = 'NON-SUPPORTED-ID';

    beforeAll(async () => {
      ctx = await createTestContext();
      app = await ctx.baseApp.asRole('practitioner');
      models = ctx.store.models;

      // Create 3 different administered vaccine and related data
      const {
        User,
        Facility,
        Department,
        Location,
        ReferenceData,
        Patient,
        Encounter,
        ScheduledVaccine,
        AdministeredVaccine,
      } = models;

      const { id: patientId } = await Patient.create({ ...fake(Patient) });
      const { id: examinerId } = await User.create(fakeUser());
      const { id: facilityId } = await Facility.create({ ...fake(Facility) });
      const { id: departmentId } = await Department.create({ ...fake(Department), facilityId });
      const { id: locationId } = await Location.create({ ...fake(Location), facilityId });
      const { id: encounterId } = await Encounter.create({
        ...fake(Encounter),
        departmentId,
        locationId,
        patientId,
        examinerId,
        endDate: null,
      });

      const [vaccineOne, vaccineTwo, vaccineThree] = await Promise.all([
        ReferenceData.create({
          ...fakeReferenceData(),
          id: 'drug-COVAX',
          code: 'COVAX',
          type: 'drug',
          name: 'COVAX',
        }),
        ReferenceData.create({
          ...fakeReferenceData(),
          id: 'drug-COVID-19-Pfizer',
          code: 'PFIZER',
          type: 'drug',
          name: 'PFIZER',
        }),
        ReferenceData.create({
          ...fakeReferenceData(),
          id: NON_SUPPORTED_VACCINE_ID,
          code: 'NON-MATCH',
          type: 'drug',
          name: 'NON-MATCH',
        }),
      ]);

      const [scheduleOne, scheduleTwo, scheduleThree] = await Promise.all([
        ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          vaccineId: vaccineOne.id,
        }),
        ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          vaccineId: vaccineTwo.id,
        }),
        ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          vaccineId: vaccineThree.id,
        }),
      ]);

      await Promise.all([
        AdministeredVaccine.create({
          ...fake(AdministeredVaccine),
          status: 'GIVEN',
          date: new Date(),
          recorderId: examinerId,
          scheduledVaccineId: scheduleOne.id,
          encounterId,
        }),
        AdministeredVaccine.create({
          ...fake(AdministeredVaccine),
          status: 'GIVEN',
          date: new Date(),
          recorderId: examinerId,
          scheduledVaccineId: scheduleTwo.id,
          encounterId,
        }),
        AdministeredVaccine.create({
          ...fake(AdministeredVaccine),
          status: 'GIVEN',
          date: new Date(),
          recorderId: examinerId,
          scheduledVaccineId: scheduleThree.id,
          encounterId,
        }),
      ]);
    });
    afterAll(() => ctx.close());

    describe('success', () => {
      it("returns no error but no results when patient reference doesn't match", async () => {
        const id = '123456789';
        const path = `/v1/integration/${integrationName}/Immunization?_sort=-issued&_page=0&_count=2&patient=${id}`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'immunizations',
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

      it("returns no error but no results when vaccine code doesn't match", async () => {
        const path = `/v1/integration/${integrationName}/Immunization?_sort=-issued&_page=0&_count=2&vaccine-code=${NON_SUPPORTED_VACCINE_ID}`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveSucceeded();
        expect(response.body).toEqual({
          resourceType: 'Bundle',
          id: 'immunizations',
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

      it('returns a list of supported immunizations when passed no query params', async () => {
        const response = await app
          .get(`/v1/integration/${integrationName}/Immunization`)
          .set(requestHeaders);
        expect(response).toHaveSucceeded();
        // We created 3, but only 2 types of vaccine are supported to be included
        expect(response.body.total).toBe(2);
      });
    });

    describe('failure', () => {
      it('returns a 422 error when passed the wrong query params', async () => {
        const path = `/v1/integration/${integrationName}/Immunization?_sort=id&_page=z&_count=x&status=initial`;
        const response = await app.get(path).set(requestHeaders);
        expect(response).toHaveRequestError(422);
        expect(response.body).toMatchObject({
          error: {
            errors: [
              '_count must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
              '_page must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
              '_sort must be one of the following values: -issued, issued',
            ],
          },
        });
      });
    });
  });
}
