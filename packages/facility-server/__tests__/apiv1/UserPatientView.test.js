import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';

describe('UserPatientView', () => {
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  it('should record a patient view log with appropriate details', async () => {
    const result = await app.post('/api/patientIssue').send({
      patientId: patient.id,
      note: 'A patient issue',
    });
    const viewedPatient = await app.get(`/api/patient/${patient.id}`)
    const userPatientViewLogs = await models.UserPatientView.findAll()

    get logs
    expect 1
    check details
    // expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });
});
