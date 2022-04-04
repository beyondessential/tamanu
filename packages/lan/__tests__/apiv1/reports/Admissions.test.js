import {
  createDummyPatient,
  createDummyEncounter,
  createDummyEncounterDiagnosis,
  randomRecord,
  randomRecords,
  randomReferenceData,
} from 'shared/demoData';
import { subDays, format } from 'date-fns';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { findOneOrCreate } from 'shared/test-helpers';
import { createTestContext } from '../../utilities';

describe('Admissions report', () => {
  let expectedPatient = null;
  let app = null;
  let expectedLocation = null;
  let wrongLocation = null;
  let expectedDepartment = null;
  let expectedExaminer = null;
  let expectedDiagnosis1 = null;
  let expectedDiagnosis2 = null;
  let expectedVillage = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    expectedVillage = await randomReferenceData(models, 'village');
    expectedPatient = await models.Patient.create(
      await createDummyPatient(models, { villageId: expectedVillage.id }),
    );
    app = await baseApp.asRole('practitioner');
    expectedLocation = await findOneOrCreate(ctx, models.Location, { name: 'Clinic' });
    wrongLocation = await randomRecord(models, 'Location');
    expectedDepartment = await randomRecord(models, 'Department');
    expectedExaminer = await randomRecord(models, 'User');
    expectedDiagnosis1 = await findOneOrCreate(ctx, models.ReferenceData, {
      type: 'icd10',
      code: 'H60.5',
      name: 'Acute bacterial otitis externa',
    });
    expectedDiagnosis2 = await findOneOrCreate(ctx, models.ReferenceData, {
      type: 'icd10',
      code: 'L74.4',
      name: 'Anhidrosis',
    });
  });
  afterAll(() => ctx.close());

  it('should reject creating an admissions report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(`/v1/reports/admissions`, {});
    expect(result).toBeForbidden();
  });

  describe('returns data based on supplied parameters', () => {
    beforeEach(async () => {
      await models.Encounter.destroy({ where: {} });
    });
    it('should return only admitted patient', async () => {
      const baseEncounterData = {
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: new Date(2021, 1, 20), // Months are 0 indexed so this is Feburary
        endDate: new Date(2021, 1, 21), // Months are 0 indexed so this is Feburary
        patientId: expectedPatient.dataValues.id,
        locationId: expectedLocation.id,
        departmentId: expectedDepartment.id,
        examinerId: expectedExaminer.id,
      };
      // expected result
      const expectedEncounter = await models.Encounter.create(
        await createDummyEncounter(models, baseEncounterData),
      );

      const baseEncounterDiagnosisData = {
        certainty: 'confirmed',
        isPrimary: true,
        diagnosisId: expectedDiagnosis1.id,
        encounterId: expectedEncounter.id,
      };

      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, baseEncounterDiagnosisData),
      );

      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, {
          ...baseEncounterDiagnosisData,
          diagnosisId: expectedDiagnosis2.id,
        }),
      );

      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, {
          ...baseEncounterDiagnosisData,
          isPrimary: false,
          certainty: 'disproven',
          diagnosisId: expectedDiagnosis2.id,
        }),
      );

      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, {
          ...baseEncounterDiagnosisData,
          isPrimary: false,
        }),
      );

      // wrong encounter type
      await models.Encounter.create(
        await createDummyEncounter(models, {
          ...baseEncounterData,
          encounterType: ENCOUNTER_TYPES.EMERGENCY,
        }),
      );

      // wrong location
      await models.Encounter.create(
        await createDummyEncounter(models, {
          ...baseEncounterData,
          locationId: wrongLocation.id,
        }),
      );

      // wrong date
      await models.Encounter.create(
        await createDummyEncounter(models, {
          ...baseEncounterData,
          startDate: new Date(2020, 0, 20).toISOString(),
        }),
      );

      const result = await app.post('/v1/reports/admissions').send({
        parameters: {
          fromDate: new Date(2021, 1, 1),
          location: expectedLocation.id,
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport([
        {
          'Patient First Name': expectedPatient.firstName,
          'Patient Last Name': expectedPatient.lastName,
          'Patient ID': expectedPatient.displayId,
          'Date of Birth': format(expectedPatient.dateOfBirth, 'dd/MM/yyyy'),
          Location: expectedLocation.name,
          Department: expectedDepartment.name,
          'Primary diagnoses': 'H60.5 Acute bacterial otitis externa; L74.4 Anhidrosis',
          'Secondary diagnoses': 'H60.5 Acute bacterial otitis externa',
          Sex: expectedPatient.sex,
          Village: expectedVillage.name,
          'Doctor/Nurse': expectedExaminer.displayName,
          'Admission Date': '20/02/2021',
          'Discharge Date': '21/02/2021',
        },
      ]);
    });
  });
});
