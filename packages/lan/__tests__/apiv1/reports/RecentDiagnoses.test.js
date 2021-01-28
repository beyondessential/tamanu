import {
  createDummyPatient,
  createDummyEncounter,
  randomUser,
  randomReferenceId,
  createDummyEncounterDiagnosis,
  randomReferenceData,
} from 'shared/demoData/patients';
import moment from 'moment';
import { createTestContext } from '../../utilities';
import { ENCOUNTER_TYPES } from 'shared/constants';

const { baseApp, models } = createTestContext();

describe('Recent Diagnoses report', () => {
  let app = null;
  let patient1 = null;
  let expectedDiagnosis = null;
  let wrongDiagnosis = null;
  let expectedLocation = null;

  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
    const villageId = await randomReferenceId(models, 'village');
    patient1 = await models.Patient.create(await createDummyPatient(models, { villageId }));
    expectedDiagnosis = await randomReferenceId(models, 'icd10');
    wrongDiagnosis = await randomReferenceId(models, 'icd10');
    expectedLocation = await randomReferenceId(models, 'location');
  });

  it('should reject creating a diagnoses report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(`/v1/reports/recent-diagnoses`, {});
    expect(result).toBeForbidden();
  });

  describe('returns data based on supplied parameters', () => {
    beforeEach(async () => {
      await models.EncounterDiagnosis.destroy({ where: {}, truncate: true });
      await models.Encounter.destroy({ where: {}, truncate: true });
    });

    it('should return only requested diagnoses', async () => {
      const encounter = await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: moment()
            .subtract(1, 'day')
            .toISOString(),
          patientId: patient1.dataValues.id,
          locationId: expectedLocation,
        }),
      );

      // expected result
      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, {
          current: true,
          diagnosisId: expectedDiagnosis,
          encounterId: encounter.dataValues.id,
        }),
      );

      // wrong diagnosis
      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, {
          current: true,
          diagnosisId: wrongDiagnosis,
          encounterId: encounter.dataValues.id,
        }),
      );

      const result = await app.post('/v1/reports/recent-diagnoses').send({
        parameters: { diagnosis: expectedDiagnosis },
      });
      expect(result).toHaveSucceeded();
      expect(result.body.length).toEqual(2);
      expect(result.body[1][2]).toEqual(patient1.firstName);
      expect(result.body[1][3]).toEqual(patient1.lastName);
    });

    it('should return multiple requested diagnoses', async () => {
      const encounter = await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: moment()
            .subtract(1, 'day')
            .toISOString(),
          patientId: patient1.dataValues.id,
          locationId: expectedLocation,
        }),
      );

      const firstDiagnosis = await randomReferenceData(models, 'icd10');

      // first diagnosis
      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, {
          current: true,
          diagnosisId: firstDiagnosis.id,
          encounterId: encounter.dataValues.id,
        }),
      );

      const secondDiagnosis = await randomReferenceData(models, 'icd10');
      // second diagnosis
      await models.EncounterDiagnosis.create(
        await createDummyEncounterDiagnosis(models, {
          current: true,
          diagnosisId: secondDiagnosis.id,
          encounterId: encounter.dataValues.id,
        }),
      );

      const result = await app.post('/v1/reports/recent-diagnoses').send({
        parameters: { diagnosis: firstDiagnosis.id, diagnosis2: secondDiagnosis.id },
      });
      expect(result).toHaveSucceeded();
      expect(result.body.length).toEqual(3);
      expect(result.body[1][1]).toEqual(firstDiagnosis.name);
      expect(result.body[2][1]).toEqual(secondDiagnosis.name);
    });
  });
});
