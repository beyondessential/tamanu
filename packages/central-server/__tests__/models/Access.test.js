import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';

describe('Access', () => {
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  it('should record a patient view log with appropriate details', async () => {
    const testUrl = `/api/admin/lookup/patient/${patient.displayId}`;
    await app.get(testUrl);
    const userPatientViewLogs = await models.Access.findAll({ raw: true });

    expect(userPatientViewLogs).toHaveLength(1);
    const testLog = userPatientViewLogs[0];
    expect(testLog).toMatchObject({
      patientId: patient.id,
      userId: app.user.id,
      facilityId: null,
      context: testUrl,
    });
  });
});
