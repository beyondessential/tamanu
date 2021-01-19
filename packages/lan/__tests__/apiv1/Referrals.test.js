import { createDummyPatient, createDummyEncounter, FACILITIES, DEPARTMENTS } from 'shared/demoData';
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
    encounter = await models.Encounter.create(await createDummyEncounter(models, { current: true, patientId: patient.id}));
    facility = await models.ReferenceData.create(
      { code: 'test_facility_code', type: 'facility', ...FACILITIES[0] }
    );
    department = await models.ReferenceData.create(
      { code: 'test_department_code', type: 'department', ...DEPARTMENTS[0] }
    );
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
    expect(body.data[0]).toHaveProperty('referredToDepartmentId', createdReferral.referredToDepartmentId);
    expect(body.data[0]).toHaveProperty('referredToFacilityId', createdReferral.referredToFacilityId);
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
    expect(record).toHaveProperty('referredBy.displayName');
    expect(record).toHaveProperty('referredToDepartment.code');
    expect(record).toHaveProperty('referredToFacility.code');
  });
});
