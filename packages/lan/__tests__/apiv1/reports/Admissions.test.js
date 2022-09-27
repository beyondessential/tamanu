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
import { parseISO9075, toDateTimeString } from 'shared/utils/dateTime';
import { createTestContext } from '../../utilities';

describe('Admissions report', () => {
  let expectedPatient = null;
  let app = null;
  let expectedLocation = null;
  let wrongLocation = null;
  let expectedDepartment1 = null;
  let expectedDepartment2 = null;
  let expectedExaminer = null;
  let expectedDiagnosis1 = null;
  let expectedDiagnosis2 = null;
  let expectedVillage = null;
  let expectedBillingType = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    expectedVillage = await randomReferenceData(models, 'village');
    expectedPatient = await models.Patient.create(
      await createDummyPatient(models, {
        villageId: expectedVillage.id,
        // Just shy of 2 years old
        dateOfBirth: subDays(new Date(), 365 * 2 - 5),
      }),
    );
    app = await baseApp.asRole('practitioner');
    expectedLocation = await findOneOrCreate(ctx.models, models.Location, { name: 'Clinic' });
    wrongLocation = await findOneOrCreate(ctx.models, models.Location, { name: 'Not-Clinic' });
    expectedDepartment1 = await findOneOrCreate(ctx.models, models.Department, {
      name: 'Radiology',
    });
    expectedDepartment2 = await findOneOrCreate(ctx.models, models.Department, {
      name: 'Cardiology',
    });
    expectedExaminer = await randomRecord(models, 'User');
    expectedDiagnosis1 = await findOneOrCreate(ctx.models, models.ReferenceData, {
      type: 'icd10',
      code: 'H60.5',
      name: 'Acute bacterial otitis externa',
    });
    expectedDiagnosis2 = await findOneOrCreate(ctx.models, models.ReferenceData, {
      type: 'icd10',
      code: 'L74.4',
      name: 'Anhidrosis',
    });
    expectedBillingType = await findOneOrCreate(ctx.models, models.ReferenceData, {
      type: 'patientBillingType',
      name: 'Charity',
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
        startDate: toDateTimeString(new Date(2021, 1, 20, 9, 7, 26)), // Months are 0 indexed so this is Feburary
        endDate: toDateTimeString(new Date(2021, 1, 21, 11, 3, 7)), // Months are 0 indexed so this is Feburary
        patientId: expectedPatient.dataValues.id,
        locationId: expectedLocation.id,
        departmentId: expectedDepartment1.id,
        examinerId: expectedExaminer.id,
        patientBillingTypeId: expectedBillingType.id,
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
          startDate: toDateTimeString(new Date(2020, 0, 20)),
        }),
      );

      await expectedEncounter.update({
        departmentId: expectedDepartment2.id,
      });

      const departmentChangeNotePage = await models.NotePage.findOne({
        include: [
          {
            model: models.NoteItem,
            as: 'noteItems',
          },
        ],
        where: {
          recordId: expectedEncounter.id,
          noteType: 'system',
        },
      });

      await departmentChangeNotePage.noteItems?.[0].update({
        date: toDateTimeString(new Date(2021, 1, 20, 11, 10)),
      });

      const result = await app.post('/v1/reports/admissions').send({
        parameters: {
          fromDate: toDateTimeString(new Date(2021, 1, 1)),
          location: expectedLocation.id,
          department: expectedDepartment1.id, // Historical department filtered for
        },
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchTabularReport([
        {
          'Patient First Name': expectedPatient.firstName,
          'Patient Last Name': expectedPatient.lastName,
          'Patient ID': expectedPatient.displayId,
          Sex: expectedPatient.sex,
          Village: expectedVillage.name,
          'Date of Birth': format(parseISO9075(expectedPatient.dateOfBirth), 'dd/MM/yyyy'),
          Age: 1,
          'Patient Type': 'Charity',
          'Admitting Doctor/Nurse': expectedExaminer.displayName,
          'Admission Date': '20/02/2021 9:07:26 AM',
          'Discharge Date': '21/02/2021 11:03:07 AM',
          Location: 'Clinic (Location assigned: 20/02/21 9:07 AM)',
          Department:
            'Radiology (Department assigned: 20/02/21 9:07 AM); Cardiology (Department assigned: 20/02/21 11:10 AM)',
          'Primary diagnoses': 'H60.5 Acute bacterial otitis externa; L74.4 Anhidrosis',
          'Secondary diagnoses': 'H60.5 Acute bacterial otitis externa',
        },
      ]);
    });
  });
});
