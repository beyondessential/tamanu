import {
  createDummyPatient,
  createDummyEncounter,
  randomRecordId,
  randomReferenceId,
} from 'shared/demoData';
import { subDays } from 'date-fns';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { createTestContext } from '../../utilities';

describe('Admissions report', () => {
  let expectedPatient = null;
  let wrongPatient = null;
  let app = null;
  let expectedLocation = null;
  let expectedDepartment = null;
  let expectedVillageId = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    const villageId = await randomReferenceId(models, 'village');
    expectedVillageId = villageId;
    expectedPatient = await models.Patient.create(await createDummyPatient(models, { villageId }));
    wrongPatient = await models.Patient.create(await createDummyPatient(models, { villageId }));
    app = await baseApp.asRole('practitioner');
    expectedLocation = await randomRecordId(models, 'Location');
    expectedDepartment = await randomRecordId(models, 'Department');
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
      // expected result
      await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: subDays(new Date(), 1).toISOString(),
          patientId: expectedPatient.dataValues.id,
          locationId: expectedLocation,
        }),
      );

      // wrong encounter type
      await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.EMERGENCY,
          startDate: subDays(new Date(), 1).toISOString(),
          patientId: wrongPatient.dataValues.id,
          locationId: expectedLocation,
        }),
      );
      const result = await app.post('/v1/reports/admissions').send({
        parameters: { location: expectedLocation },
      });
      expect(result).toHaveSucceeded();

      expect(result.body).toMatchTabularReport([
        {
          'Patient First Name': expectedPatient.firstName,
          'Patient Last Name': expectedPatient.lastName,
          'Patient ID': expectedPatient.displayId,
          'Date of Birth': expectedPatient.dob, // TODO: format
          Location: expectedLocation,
          Department: expectedDepartment,
          'Primary diagnoses': '',
          'Secondary diagnoses': '',
          Sex: expectedPatient.sex,
          Village: expectedVillageId,
          'Doctor/Nurse': 'asdf',
          'Admission Date': 'asdf',
          'Discharge Date': 'asdlkf',
        },
      ]);
    });
  });
});
