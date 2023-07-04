import { formatRFC7231 } from 'date-fns';

import { fake, chance, fakeReferenceData, fakeUser } from 'shared/test-helpers';
import { formatFhirDate } from 'shared/utils/fhir/datetime';
import { fakeUUID } from 'shared/utils/generateId';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

async function destroyDatabaseTables(models) {
  const modelNames = [
    'FhirImmunization',
    'Facility',
    'Department',
    'Location',
    'ReferenceData',
    'Patient',
    'Encounter',
    'ScheduledVaccine',
    'AdministeredVaccine',
  ];

  for (const modelName of modelNames) {
    const model = models[modelName];
    await model.destroy({ where: {} });
  }
}

async function createAdministeredVaccineHierarchy(models, isCovidVaccine = false) {
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

  const patient = await Patient.create(fake(Patient));
  const examiner = await User.create(fakeUser());
  const facility = await Facility.create(fake(Facility));
  const department = await Department.create({ ...fake(Department), facilityId: facility.id });
  const location = await Location.create({ ...fake(Location), facilityId: facility.id });
  const encounter = await Encounter.create({
    ...fake(Encounter),
    departmentId: department.id,
    locationId: location.id,
    patientId: patient.id,
    examinerId: examiner.id,
    endDate: null,
  });

  const vaccine = await ReferenceData.create({
    ...fakeReferenceData(),
    type: 'drug',
    ...(isCovidVaccine &&
      chance.pickone([
        { id: 'drug-COVAX', code: 'COVAX', name: 'COVAX' },
        { id: 'drug-COVID-19-Pfizer', code: 'PFIZER', name: 'PFIZER' },
      ])),
  });

  const scheduledVaccine = await ScheduledVaccine.create({
    ...fake(ScheduledVaccine),
    vaccineId: vaccine.id,
  });

  const administeredVaccine = await AdministeredVaccine.create({
    ...fake(AdministeredVaccine),
    status: 'GIVEN',
    date: new Date(),
    recorderId: examiner.id,
    scheduledVaccineId: scheduledVaccine.id,
    encounterId: encounter.id,
  });

  return {
    patient,
    examiner,
    facility,
    department,
    location,
    encounter,
    vaccine,
    scheduledVaccine,
    administeredVaccine,
  };
}

describe(`Materialised FHIR - Immunization`, () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('materialise', () => {
    beforeEach(async () => {
      await destroyDatabaseTables(ctx.store.models);
    });

    it('fetches an immunization by materialised ID', async () => {
      const { FhirImmunization } = ctx.store.models;
      const {
        patient,
        examiner,
        encounter,
        vaccine,
        scheduledVaccine,
        administeredVaccine,
      } = await createAdministeredVaccineHierarchy(ctx.store.models);
      const mat = await FhirImmunization.materialiseFromUpstream(administeredVaccine.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization/${mat.id}`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response.body).toMatchObject({
        resourceType: 'Immunization',
        meta: {
          lastUpdated: formatFhirDate(mat.lastUpdated),
        },
        status: 'completed',
        vaccineCode: {
          text: vaccine.name,
        },
        patient: {
          reference: expect.stringContaining(patient.id),
          display: [patient.firstName, patient.lastName].filter(x => x).join(' '),
        },
        encounter: {
          reference: expect.stringContaining(encounter.id),
        },
        occurrenceDateTime: formatFhirDate(administeredVaccine.date),
        lotNumber: administeredVaccine.batch,
        site: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActSite',
                display: administeredVaccine.injectionSite,
              },
            ],
          },
        ],
        performer: [
          {
            actor: {
              reference: expect.stringContaining(examiner.id),
            },
          },
        ],
        protocolApplied: [
          {
            doseNumberString: scheduledVaccine.schedule,
            targetDisease: [],
          },
        ],
      });
    });

    it('materialises without a recorder', async () => {
      const { FhirImmunization } = ctx.store.models;
      const { administeredVaccine } = await createAdministeredVaccineHierarchy(ctx.store.models);
      administeredVaccine.recorderId = null;
      await administeredVaccine.save();
      const mat = await FhirImmunization.materialiseFromUpstream(administeredVaccine.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization/${mat.id}`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response.body).toMatchObject({
        resourceType: 'Immunization',
        meta: {
          lastUpdated: formatFhirDate(mat.lastUpdated),
        },
        status: 'completed',
        performer: [],
      });
    });

    it('returns a list of immunizations when passed no query params', async () => {
      const { FhirImmunization } = ctx.store.models;

      for (let i = 0; i < 2; i++) {
        const { administeredVaccine } = await createAdministeredVaccineHierarchy(ctx.store.models);
        await FhirImmunization.materialiseFromUpstream(administeredVaccine.id);
      }

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(2);
    });
  });

  describe('filtering', () => {
    beforeEach(async () => {
      await destroyDatabaseTables(ctx.store.models);
    });

    // Unskip when we support searching by references
    it.skip('filters immunizations by patient', async () => {
      const { FhirImmunization } = ctx.store.models;
      let patientId;

      for (let i = 0; i < 2; i++) {
        const { patient, administeredVaccine } = await createAdministeredVaccineHierarchy(
          ctx.store.models,
        );
        await FhirImmunization.materialiseFromUpstream(administeredVaccine.id);
        if (i === 0) {
          patientId = patient.id;
        }
      }

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization?patient=Patient/${patientId}`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(1);
    });

    it('filters immunizations by vaccineId (vaccine-code)', async () => {
      const { FhirImmunization } = ctx.store.models;
      const { vaccine, administeredVaccine } = await createAdministeredVaccineHierarchy(
        ctx.store.models,
        true,
      );
      await FhirImmunization.materialiseFromUpstream(administeredVaccine.id);
      const vaccineId = vaccine.id;
      const vaccineCode = vaccineId === 'drug-COVAX' ? 'COVAST' : 'COMIRN';

      const { administeredVaccine: otherAdmVx } = await createAdministeredVaccineHierarchy(
        ctx.store.models,
      );
      await FhirImmunization.materialiseFromUpstream(otherAdmVx.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization?vaccine-code=${vaccineCode}`;
      const response = await app.get(path);

      expect(response).toHaveSucceeded();
      expect(response.body.total).toBe(1);
    });
  });

  describe('errors', () => {
    it('returns not found when fetching a non-existent immunization', async () => {
      const id = fakeUUID();

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization/${id}`;
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
              text: `no Immunization with id ${id}`,
            },
          },
        ],
      });
    });

    it('returns some errors when passed wrong query params', async () => {
      const { FhirImmunization } = ctx.store.models;
      const { administeredVaccine } = await createAdministeredVaccineHierarchy(ctx.store.models);
      await FhirImmunization.materialiseFromUpstream(administeredVaccine.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization?_sort=id&_page=z&_count=x`;
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

    it('returns an error if there are any unknown immunization params', async () => {
      const { FhirImmunization } = ctx.store.models;
      const { administeredVaccine } = await createAdministeredVaccineHierarchy(ctx.store.models);
      await FhirImmunization.materialiseFromUpstream(administeredVaccine.id);

      const path = `/v1/integration/${INTEGRATION_ROUTE}/Immunization?whatever=something`;
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
