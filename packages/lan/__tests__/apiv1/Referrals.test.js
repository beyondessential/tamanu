import Chance from 'chance';
import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();
const chance = new Chance();
const createUser = overrides => ({
  email: chance.email(),
  displayName: chance.name(),
  password: chance.word(),
  ...overrides,
});

describe('Referrals', () => {
  let patient = null;
  let app = null;
  let specialist = null;

  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    specialist = await models.User.create(
      createUser({
        role: 'practitioner',
      }),
    );
  });

  it('should record a referral request', async () => {
    const result = await app.post('/v1/referral').send({
      patientId: patient.id,
      referredById: app.user.id,
      referredToId: specialist.id,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.date).toBeTruthy();
  });

  it('should require a valid referred practitioner', async () => {
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
      referredToId: specialist.id,
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
      referredToId: specialist.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();

    const { body } = result;

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('referredToId', createdReferral.referredToId);
  });

  it('should get referral reference info when listing referrals', async () => {
    const createdReferral = await models.Referral.create({
      patientId: patient.id,
      referredById: app.user.id,
      referredToId: specialist.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();
    const { body } = result;
    expect(body.count).toBeGreaterThan(0);

    const record = body.data[0];
    expect(record).toHaveProperty('referredBy.displayName');
    expect(record).toHaveProperty('referredTo.displayName');
  });
});
