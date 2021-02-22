import { createDummyPatient, createDummyEncounter } from 'shared/demoData';
import { DIAGNOSIS_CERTAINTY } from 'shared/constants';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Referrals', () => {
  let app = null;
  let patient = null;
  let encounter = null;
  let facility = null;
  let department = null;

  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    facility = await models.ReferenceData.findOne({ where: { type: 'facility' } });
    department = await models.ReferenceData.findOne({ where: { type: 'department' } });
  });

  it('should record a referral request', async () => {
    const result = await app.post('/v1/referral').send({
      patientId: patient.id,
      referredById: app.user.id,
      referredToDepartmentId: department.id,
      referredToFacilityId: facility.id,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.date).toBeTruthy();
  });

  it('should require a valid referred department', async () => {
    const result = await app.post('/v1/referral').send({
      patientId: patient.id,
      referredById: app.user.id,
    });
    expect(result).toHaveRequestError();
  });

  it('should have a valid patient', async () => {
    const createdReferral = await models.Referral.create({
      patientId: patient.id,
      referredById: app.user.id,
      referredToDepartmentId: department.id,
      referredToFacilityId: facility.id,
    });

    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();

    const { body } = result;

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('patientId', createdReferral.patientId);
  });

  it('should get referral requests for a patient', async () => {
    const createdReferral = await models.Referral.create({
      patientId: patient.id,
      referredById: app.user.id,
      referredToDepartmentId: department.id,
      referredToFacilityId: facility.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();

    const { body } = result;

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty(
      'referredToDepartmentId',
      createdReferral.referredToDepartmentId,
    );
    expect(body.data[0]).toHaveProperty(
      'referredToFacilityId',
      createdReferral.referredToFacilityId,
    );
  });

  it('should get referral reference info when listing referrals', async () => {
    const createdReferral = await models.Referral.create({
      patientId: patient.id,
      referredById: app.user.id,
      referredToDepartmentId: department.id,
      referredToFacilityId: facility.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.count).toBeGreaterThan(0);

    const record = body.data[0];
    expect(record).toHaveProperty('referredBy.displayName', app.user.displayName);
    expect(record).toHaveProperty('referredToDepartment.code', department.code);
    expect(record).toHaveProperty('referredToFacility.code', facility.code);
  });

  describe('diagnoses', () => {
    let expectDiagnosis = null;

    beforeAll(async () => {
      expectDiagnosis = await models.ReferenceData.create({
        type: 'icd10',
        name: 'Malady',
        code: 'malady',
      });
    });

    it('should record a diagnosis', async () => {
      const createReferralResult = await app.post('/v1/referral').send({
        patientId: patient.id,
        referredById: app.user.id,
        referredToDepartmentId: department.id,
        referredToFacilityId: facility.id,
        diagnosisId0: expectDiagnosis.id,
        diagnosisCertainty0: DIAGNOSIS_CERTAINTY.SUSPECTED,
      });
      expect(createReferralResult).toHaveSucceeded();

      const referralDiagnosesResult = await app.get(
        `/v1/referral/${createReferralResult.body.id}/diagnoses`,
      );
      expect(referralDiagnosesResult).toHaveSucceeded();
      expect(referralDiagnosesResult.body.count).toBeGreaterThan(0);
      expect(referralDiagnosesResult.body.data[0]).toHaveProperty(
        'diagnosisId',
        expectDiagnosis.id,
      );
      expect(referralDiagnosesResult.body.data[0]).toHaveProperty(
        'certainty',
        DIAGNOSIS_CERTAINTY.SUSPECTED,
      );
    });
    
    it('should record multiple diagnoses correctly', async () => {
      const secondDiagnosis = await models.ReferenceData.create({
        type: 'icd10',
        name: 'Diabetes',
        code: 'diabetes',
      });
      const createReferralResult = await app.post('/v1/referral').send({
        patientId: patient.id,
        referredById: app.user.id,
        referredToDepartmentId: department.id,
        referredToFacilityId: facility.id,
        diagnosisId0: expectDiagnosis.id,
        diagnosisCertainty0: DIAGNOSIS_CERTAINTY.SUSPECTED,
        diagnosisId1: secondDiagnosis.id,
        diagnosisCertainty1: DIAGNOSIS_CERTAINTY.CONFIRMED,
      });
      expect(createReferralResult).toHaveSucceeded();

      const referralDiagnosesResult = await app.get(
        `/v1/referral/${createReferralResult.body.id}/diagnoses`,
      );
      expect(referralDiagnosesResult).toHaveSucceeded();
      expect(referralDiagnosesResult.body.count).toBeGreaterThan(0);
      expect(referralDiagnosesResult.body.data[0]).toHaveProperty(
        'diagnosisId',
        expectDiagnosis.id,
      );
      expect(referralDiagnosesResult.body.data[0]).toHaveProperty(
        'certainty',
        DIAGNOSIS_CERTAINTY.SUSPECTED,
      );
      expect(referralDiagnosesResult.body.data[1]).toHaveProperty(
        'diagnosisId',
        secondDiagnosis.id,
      );
      expect(referralDiagnosesResult.body.data[1]).toHaveProperty(
        'certainty',
        DIAGNOSIS_CERTAINTY.CONFIRMED,
      );
    });
  });

  // TODO: Not currently implemented
  it.skip('should reference any active encounter when the referral was created', async () => {
    encounter = await models.Encounter.create(
      await createDummyEncounter(models, { current: true, patientId: patient.id }),
    );
    const createdReferral = await app.post('/v1/referral').send({
      patientId: patient.id,
      referredById: app.user.id,
      referredToDepartmentId: department.id,
      referredToFacilityId: facility.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.count).toBeGreaterThan(0);

    const record = body.data[0];
    expect(record).toHaveProperty('encounterId', encounter.id);
  });
});
