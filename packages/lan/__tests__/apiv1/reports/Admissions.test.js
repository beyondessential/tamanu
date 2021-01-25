import {
  createDummyPatient,
  createDummyEncounter,
  randomUser,
  randomReferenceId,
} from 'shared/demoData/patients';
import moment from 'moment';
import { createTestContext } from '../../utilities';
import { ENCOUNTER_TYPES } from 'shared/constants';

const { baseApp, models } = createTestContext();

describe('Admissions report', () => {
  let expectedPatient = null;
  let wrongPatient = null;
  let app = null;
  let expectedLocation = null;
  let wrongLocation = null;
  let expectedPractitioner = null;
  let wrongPractitioner = null;
  beforeAll(async () => {
    const villageId = await randomReferenceId(models, 'village');
    expectedPatient = await models.Patient.create(await createDummyPatient(models, { villageId }));
    wrongPatient = await models.Patient.create(await createDummyPatient(models, { villageId }));
    app = await baseApp.asRole('practitioner');
    expectedLocation = await randomReferenceId(models, 'location');
    wrongLocation = await randomReferenceId(models, 'location');
    expectedPractitioner = await randomUser(models);
    wrongPractitioner = await randomUser(models);
  });

  it('should reject creating an admissions report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(`/v1/reports/admissions`, {});
    expect(result).toBeForbidden();
  });

  describe('', () => {
    beforeEach(async () => {
      models.Encounter.destroy({ where: {}, truncate: true });
    });
    it('should return only admitted patient', async () => {
      // expected result
      await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: moment()
            .subtract(1, 'day')
            .toISOString(),
          patientId: expectedPatient.dataValues.id,
          locationId: expectedLocation,
        }),
      );

      // wrong encounter type
      await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.EMERGENCY,
          startDate: moment()
            .subtract(1, 'day')
            .toISOString(),
          patientId: wrongPatient.dataValues.id,
          locationId: expectedLocation,
        }),
      );
      const result = await app.post('/v1/reports/admissions').send({
        parameters: { location: expectedLocation },
      });
      expect(result).toHaveSucceeded();
      expect(result.body.length).toEqual(2);
      expect(result.body[1][0]).toEqual(expectedPatient.firstName);
      expect(result.body[1][1]).toEqual(expectedPatient.lastName);
    });

    it('should return patient at requested location', async () => {
      // expected result
      await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: moment()
            .subtract(1, 'day')
            .toISOString(),
          patientId: expectedPatient.dataValues.id,
          locationId: expectedLocation,
        }),
      );

      // wrong location
      await models.Encounter.create(
        await createDummyEncounter(models, {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: moment()
            .subtract(1, 'day')
            .toISOString(),
          patientId: wrongPatient.dataValues.id,
          locationId: wrongLocation,
        }),
      );
      const result = await app.post('/v1/reports/admissions').send({
        parameters: { location: expectedLocation },
      });
      expect(result).toHaveSucceeded();
      expect(result.body.length).toEqual(2);
      expect(result.body[1][0]).toEqual(expectedPatient.firstName);
      expect(result.body[1][1]).toEqual(expectedPatient.lastName);
    });
  });
});
