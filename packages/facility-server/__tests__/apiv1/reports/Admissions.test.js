import {
  createDummyEncounter,
  createDummyEncounterDiagnosis,
  createDummyPatient,
  randomRecord,
  randomReferenceData,
} from '@tamanu/database/demoData';
import { subDays } from 'date-fns';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { findOneOrCreate } from '@tamanu/shared/test-helpers';
import { format } from '@tamanu/utils/dateTime';
import { Op } from 'sequelize';
import { createTestContext } from '../../utilities';

describe('Admissions report', () => {
  let expectedPatient = null;
  let app = null;
  let expectedLocation = null;
  let expectedLocationGroup = null;
  let wrongLocation = null;
  let wrongLocationGroup = null;
  let newLocation = null;
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
    expectedLocationGroup = await findOneOrCreate(ctx.models, models.LocationGroup, {
      name: 'Test Area',
    });
    expectedLocation = await findOneOrCreate(ctx.models, models.Location, {
      name: 'Clinic',
      locationGroupId: expectedLocationGroup.id,
    });
    newLocation = await findOneOrCreate(ctx.models, models.Location, {
      name: 'Clinic 2',
      locationGroupId: expectedLocationGroup.id,
    });
    wrongLocationGroup = await findOneOrCreate(ctx.models, models.LocationGroup, {
      name: 'Wrong Area',
    });
    wrongLocation = await findOneOrCreate(ctx.models, models.Location, {
      name: 'Not-Clinic',
      locationGroupId: wrongLocationGroup.id,
    });

    expectedDepartment1 = await findOneOrCreate(ctx.models, models.Department, {
      name: 'Radiology',
    });
    expectedDepartment2 = await findOneOrCreate(ctx.models, models.Department, {
      name: 'Cardiology',
    });
    expectedExaminer = await randomRecord(models, 'User');
    expectedDiagnosis1 = await findOneOrCreate(ctx.models, models.ReferenceData, {
      type: 'diagnosis',
      code: 'H60.5',
      name: 'Acute bacterial otitis externa',
    });
    expectedDiagnosis2 = await findOneOrCreate(ctx.models, models.ReferenceData, {
      type: 'diagnosis',
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
    const result = await noPermsApp.post(`/api/reports/admissions`, {});
    expect(result).toBeForbidden();
  });

  describe('returns data based on supplied parameters', () => {
    beforeEach(async () => {
      await models.Encounter.destroy({ where: {} });
    });
    it('should return only admitted patient', async () => {
      const baseEncounterData = {
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: '2021-02-20 09:07:26',
        endDate: '2021-02-21 11:03:07',
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
          startDate: '2020-01-20 00:00:00',
        }),
      );

      await expectedEncounter.update({
        departmentId: expectedDepartment2.id,
      });

      await expectedEncounter.update({
        locationId: newLocation.id,
      });

      const departmentChangeNote = await models.Note.findOne({
        where: {
          recordId: expectedEncounter.id,
          noteType: 'system',
          content: {
            [Op.like]: '• Changed department from%',
          },
        },
      });

      const locationChangeNote = await models.Note.findOne({
        where: {
          recordId: expectedEncounter.id,
          noteType: 'system',
          content: {
            [Op.like]: '• Changed location from%',
          },
        },
      });

      await departmentChangeNote.update({
        date: '2021-02-20 11:10:00',
      });

      await locationChangeNote.update({
        date: '2021-02-20 12:10:00',
      });

      const result = await app.post('/api/reports/admissions').send({
        parameters: {
          fromDate: '2021-02-01 00:00:00',
          locationGroup: expectedLocationGroup.id,
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
          'Date of Birth': format(expectedPatient.dateOfBirth, 'dd/MM/yyyy'),
          Age: 1,
          'Patient Type': 'Charity',
          'Admitting Clinician': expectedExaminer.displayName,
          'Admission Date': '20/02/2021 9:07:26 AM',
          'Discharge Date': '21/02/2021 11:03:07 AM',
          Location:
            'Test Area, Clinic (Location assigned: 20/02/21 9:07 AM); Test Area, Clinic 2 (Location assigned: 20/02/21 12:10 PM)',
          Department:
            'Radiology (Department assigned: 20/02/21 9:07 AM); Cardiology (Department assigned: 20/02/21 11:10 AM)',
          'Primary diagnoses': 'H60.5 Acute bacterial otitis externa; L74.4 Anhidrosis',
          'Secondary diagnoses': 'H60.5 Acute bacterial otitis externa',
        },
      ]);
    });
  });
});
