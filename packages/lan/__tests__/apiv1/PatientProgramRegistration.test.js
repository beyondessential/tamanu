import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../utilities';

const hi = {
  programRegistryId: '123123',
  patientId: '11231231',
  registeringFacilityId: '12312312',
  registeringFacility: {
    id: '12312312',
    name: 'Home facility',
  },

  registrationStatus: 'active',

  programRegistryClinicalStatusId: '123123',
  programRegistryClinicalStatus: {
    id: '123123',
    code: 'critical',
    name: 'Critical',
    visibilityStatus: 'current',
    color: 'red',
  },

  // this...
  facilityId: '1231231',
  facility: {
    id: '1231231',
    name: 'Currently At Facility',
  },
  villageId: null,
  village: null,

  // or this...
  // facilityId: null,
  // village: null,
  // villageId: '12312312',
  // village: {
  //   id: '12312312',
  //   name: 'Currently At Village',
  // }
};
jest.setTimeout(100000);
describe('PatientProgramRegistration', () => {
  let ctx = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });

  beforeEach(async () => {
    await models.PatientProgramRegistration.truncate({ cascade: true });
    // await models.Setting.truncate();
  });

  afterAll(() => ctx.close());

  describe('GET patient/:patient_id/programRegistration', () => {
    const TEST_KEY = 'templates.test.key';
    const TEST_VALUE = 'test-value';

    it('fetches most recent registration for each program', async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const program2 = await models.Program.create(fake(models.Program));
      const program1registration1 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programId: program1.id,
          patientId: patient.id,
          date: '2023-09-02 8:00:00',
        }),
      );
      const program1registration2 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programId: program1.id,
          patientId: patient.id,
          date: '2023-09-04 8:00:00',
        }),
      );
      const program2registration1 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programId: program2.id,
          patientId: patient.id,
        }),
      );

      const result = await app.get(`/v1/patient/${patient.id}/programRegistration`);

      expect(result).toHaveSucceeded();
      expect(result.body.data).toEqual(TEST_VALUE);
    });
  });
});
