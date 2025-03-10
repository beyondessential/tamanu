import config from 'config';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

describe('UserPatientView', () => {
  const [facilityId] = selectFacilityIds(config);
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
    await app.get(`/api/patient/${patient.id}`);
    const userPatientViewLogs = await models.UserPatientView.findAll({ raw: true });

    expect(userPatientViewLogs).toHaveLength(1);
    const testLog = userPatientViewLogs[0];

    expect(testLog).toMatchObject({ patientId: patient.id, viewedById: app.user.id, facilityId });
  });
});
