import { REFERENCE_TYPES } from 'shared/constants';
import {
  createDummyPatient,
  randomReferenceId,
  randomReferenceIds,
  randomReferenceDataObjects,
  randomUser,
} from 'shared/demoData/patients';
import { createTestContext } from '../../utilities';

describe('Incomplete Referrals report', () => {
  let app = null;
  let village1 = null;
  let village2 = null;
  let patient1 = null;
  let patient2 = null;
  let practitioner1 = null;
  let practitioner2 = null;
  let department = null;
  let facility = null;
  let baseApp = null;
  let models = null;
  let diagnosis1 = null;
  let diagnosis2 = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    [village1, village2] = await randomReferenceIds(models, 'village', 2);
    patient1 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village1 }),
    );
    patient2 = await models.Patient.create(
      await createDummyPatient(models, { villageId: village2 }),
    );
    practitioner1 = await randomUser(models);
    practitioner2 = await randomUser(models);
    department = await randomReferenceId(models, REFERENCE_TYPES.DEPARTMENT);
    facility = await randomReferenceId(models, REFERENCE_TYPES.FACILITY);
  });

  it('should reject creating a diagnoses report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(`/v1/reports/incomplete-referrals`, {});
    expect(result).toBeForbidden();
  });

  describe('returns data based on supplied parameters', () => {

    beforeAll(async () => {
      const referral = await models.Referral.create({
        referralNumber: 'A',
        date: new Date(),
        patientId: patient1.dataValues.id,
        referredById: practitioner1,
        referredToDepartmentId: department,
        referredToFacilityId: facility,
      });
      [diagnosis1, diagnosis2] = await randomReferenceDataObjects(models, 'icd10', 2);
      await models.ReferralDiagnosis.create({
        certainty: 'confirmed',
        referralId: referral.dataValues.id,
        diagnosisId: diagnosis1.dataValues.id,
      });
      await models.ReferralDiagnosis.create({
        certainty: 'confirmed',
        referralId: referral.dataValues.id,
        diagnosisId: diagnosis2.dataValues.id,
      });
      await models.Referral.create({
        referralNumber: 'B',
        date: new Date(),
        patientId: patient2.dataValues.id,
        referredById: practitioner2,
        referredToDepartmentId: department,
        referredToFacilityId: facility,
      });
    });

    it('should return only requested village', async () => {
      const result = await app.post('/v1/reports/incomplete-referrals').send({
        parameters: { village: village1 },
      });
      expect(result).toHaveSucceeded();
      expect(result.body.length).toEqual(2);
      expect(result.body[1][0]).toEqual(patient1.firstName);
      expect(result.body[1][1]).toEqual(patient1.lastName);
    });

    it('should return multiple diagnoses', async () => {
      const result = await app.post('/v1/reports/incomplete-referrals').send({
        parameters: { village: village1 },
      });
      expect(result).toHaveSucceeded();
      expect(result.body.length).toEqual(2);
      // the order of diagnoses is not guaranteed, so we just check for count
      expect(result.body[1][3].split(',').length).toEqual(2);
    });
  });
});
