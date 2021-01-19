import Chance from 'chance';
import { createDummyPatient, FACILITIES, DEPARTMENTS } from 'shared/demoData';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();
const chance = new Chance();
const createUser = overrides => ({
  email: chance.email(),
  displayName: chance.name(),
  password: chance.word(),
  ...overrides,
});

const createFacility = overrides => ({
  ...FACILITIES[0],
  code: 'hi',
  type: 'facility',
  // ...overrides,
});

const createDepartment = overrides => ({
  ...DEPARTMENTS[0],
  code: 'hi',
  type: 'department',
  // ...overrides,
});


describe.only('Referrals', () => {
  let patient = null;
  let app = null;
  let facility = null;
  let department = null;

  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    facility = await models.ReferenceData.create(
      createFacility(),
    );
    department = await models.ReferenceData.create(
      createDepartment(),
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
