import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';
import { setupProgramRegistry } from '../admin/patientMerge/setupProgramRegistry';
import { REGISTRATION_STATUSES } from '@tamanu/constants';

describe('PatientProgramRegistration', () => {
  let ctx;
  let models;
  let clinician;
  let programRegistry;
  let patient;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    clinician = await models.User.create(fake(models.User));
    programRegistry = await setupProgramRegistry(models);
    patient = await models.Patient.create(fake(models.Patient));
  });
  afterAll(() => ctx.close());

  it('always generates an id combining the patient id and program registry id', async () => {
    const { PatientProgramRegistration } = models;
    const registration = await PatientProgramRegistration.create({
      patientId: patient.id,
      programRegistryId: programRegistry.id,
      date: new Date(),
      registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      clinicianId: clinician.id,
    });

    const expectedId = `${patient.id.replaceAll(';', ':')};${programRegistry.id.replaceAll(';', ':')}`;
    expect(registration.id).toBeDefined();
    expect(registration.id).toBe(expectedId);
  });
});
