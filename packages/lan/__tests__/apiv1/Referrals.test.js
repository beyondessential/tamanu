import { createDummyPatient, createDummyEncounter } from 'shared/demoData';
import { createTestContext } from '../utilities';

describe('Referrals', () => {
  let baseApp = null;
  let models = null;
  let app = null;
  let patient = null;
  let encounter = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
  });

  it('should record a referral request', async () => {
    const result = await app.post('/v1/referral').send({
      initiatingEncounterId: encounter.id,
      referredFacility: 'Test facility'
    });
    expect(result).toHaveSucceeded();
  });

  it('should get all referrals for a patient', async () => {
    await app.post('/v1/referral').send({
      initiatingEncounterId: encounter.id,
      referredFacility: 'Test facility'
    });
    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();
    expect(result.body.length).toEqual(2);
  });
});
