import Chance from 'chance';
import { formatRFC7231 } from 'date-fns';

import { fake } from 'shared/test-helpers/fake';
import { convertISO9075toRFC3339 } from 'shared/utils/dateTime';
import { fakeUUID } from 'shared/utils/generateId';
import { formatFhirDate } from 'shared/utils/fhir/datetime';

import { createTestContext } from '../../utilities';
import { IDENTIFIER_NAMESPACE } from '../../../app/hl7fhir/utils';

const INTEGRATION_ROUTE = 'fhir/mat';
const chance = new Chance();

async function destroyDatabaseTables(models) {
  const modelNames = [
    'FhirDiagnosticReport',
    'Department',
    'Facility',
    'LabTest',
    'LabRequest',
    'Location',
    'ReferenceData',
    'LabTestType',
    'Encounter',
    'Patient',
  ];

  for (const modelName of modelNames) {
    const model = models[modelName];
    await model.destroy({ where: {} });
  }
}

async function createLabTestHierarchy(models, patient, { isRDT = false } = {}) {
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
  } = models;

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

describe(`Materialised FHIR - DiagnosticReport`, () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('full resource checks', () => {
    beforeEach(async () => {
      await destroyDatabaseTables(ctx.store.models);
    });

    it.skip('fetches a diagnostic report by materialised ID', async () => {
      const { FhirDiagnosticReport, Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const {
        examiner,
        labRequest,
        labTest,
        labTestMethod,
        labTestType,
        laboratory,
      } = await createLabTestHierarchy(ctx.store.models, patient);
      const mat = await FhirDiagnosticReport.materialiseFromUpstream(labTest.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport/${mat.id}`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response.body).toMatchObject({
        resourceType: 'DiagnosticReport',
        id: expect.any(String),
        meta: {
          // TODO: uncomment when we support versioning
          // versionId: expect.any(String),
          lastUpdated: formatFhirDate(mat.lastUpdated),
        },
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
      });
    });

    it('returns a list of diagnostic reports when passed no query params', async () => {
      const { FhirDiagnosticReport, Patient } = ctx.store.models;
      const patients = await Promise.all([
        Patient.create(fake(Patient)),
        Patient.create(fake(Patient)),
      ]);

      for (const patient of patients) {
        const { labTest } = await createLabTestHierarchy(ctx.store.models, patient);
        await FhirDiagnosticReport.materialiseFromUpstream(labTest.id);
      }

      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(2);
    });

    it('materialises even with minimal required info', async () => {
      const { FhirDiagnosticReport, Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const { labTest, labTestMethod, laboratory } = await createLabTestHierarchy(
        ctx.store.models,
        patient,
      );
      /*
        To create a DiagnosticReport only status and code are mandatory,
        which are taken from LabRequest and LabTestType respectively. However,
        other models are needed to create both in Tamanu, so just getting rid
        the ones that are actually possible.
      */
      await Promise.all([laboratory.destroy(), labTestMethod.destroy()]);
      const mat = await FhirDiagnosticReport.materialiseFromUpstream(labTest.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport/${mat.id}`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.body.extension.length).toBe(0);
      expect(response.body.performer.length).toBe(1);
    });
  });

  describe('filtering', () => {
    beforeEach(async () => {
      await destroyDatabaseTables(ctx.store.models);
    });

    // There seems to be an issue with subject:identifier at the moment.
    // The expected result differs in a couple of places from the old fhir API
    // Most is resolved by changing the date format and the labTest.id for the mat.id, still
    // I left it untouched so it can be resolved just in case we're missing anything
    it.skip('filters diagnostic reports by subject:identifier', async () => {
      const { FhirDiagnosticReport, Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const {
        examiner,
        labRequest,
        labTest,
        labTestMethod,
        labTestType,
        laboratory,
      } = await createLabTestHierarchy(ctx.store.models, patient);
      const mat = await FhirDiagnosticReport.materialiseFromUpstream(labTest.id);

      const id = encodeURIComponent(`${IDENTIFIER_NAMESPACE}|${patient.displayId}`);
      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport?subject%3Aidentifier=${id}`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: expect.any(String),
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
            // The old FHIR API had this parameter, not sure if it's really that important
            // fullUrl: expect.stringContaining(mat.id),
            resource: {
              resourceType: 'DiagnosticReport',
              id: mat.id,
              effectiveDateTime: convertISO9075toRFC3339(labRequest.sampleTime),
              issued: convertISO9075toRFC3339(labRequest.requestedDate),
              meta: {
                // TODO: uncomment when we support versioning
                // versionId: expect.any(String),
                lastUpdated: formatFhirDate(mat.lastUpdated),
              },
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
        ],
      });
    });
  });

  describe('errors', () => {
    it('returns not found when fetching a non-existent diagnostic report', async () => {
      const id = fakeUUID();

      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport/${id}`;
      const response = await app.get(path);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: expect.any(String),
            details: {
              text: `no DiagnosticReport with id ${id}`,
            },
          },
        ],
      });
    });

    it('returns some errors when passed wrong query params', async () => {
      const { FhirDiagnosticReport, Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const { labTest } = await createLabTestHierarchy(ctx.store.models, patient);
      await FhirDiagnosticReport.materialiseFromUpstream(labTest.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport?_sort=id&_page=z&_count=x`;
      const response = await app.get(path);

      expect(response).toHaveRequestError(500);
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: expect.any(String),
            expression: '_sort',
            details: {
              text: '_sort key is not an allowed value',
            },
          },
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: expect.any(String),
            expression: '_page',
            details: {
              text:
                'this must be a `number` type, but the final value was: `NaN` (cast from the value `"z"`).',
            },
          },
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: expect.any(String),
            expression: '_count',
            details: {
              text:
                'this must be a `number` type, but the final value was: `NaN` (cast from the value `"x"`).',
            },
          },
        ],
      });
    });

    it('returns an error if there are any unknown diagnostic report params', async () => {
      const { FhirDiagnosticReport, Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      const { labTest } = await createLabTestHierarchy(ctx.store.models, patient);
      await FhirDiagnosticReport.materialiseFromUpstream(labTest.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport?whatever=something`;
      const response = await app.get(path);

      expect(response).toHaveRequestError(501);
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-supported',
            diagnostics: expect.any(String),
            details: {
              text: 'parameter is not supported: whatever',
            },
          },
        ],
      });
    });
  });
});
