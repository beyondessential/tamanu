import { createDummyPatient, createDummyEncounter } from 'shared/demoData';
import { createTestContext } from '../utilities';

describe('Referrals', () => {
  let baseApp = null;
  let models = null;
  let app = null;
  let patient = null;
  let encounter = null;
  let facility = null;
  let department = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    facility = await models.ReferenceData.findOne({ where: { type: 'facility' } });
    department = await models.ReferenceData.findOne({ where: { type: 'department' } });
  });

  it('should record a referral request', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const result = await app.post('/v1/referral').send({
      initiatingEncounter: encounter.id
    });
    expect(result).toHaveSucceeded();
    expect(result.body.date).toBeTruthy();
  });

  it.skip('should have a valid patient', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();

    const { body } = result;

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('patientId', createdReferral.patientId);
  });

  it.skip('should get referral requests for a patient', async () => {
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

  it.skip('should get referral reference info when listing referrals', async () => {
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
