import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';
import { setupProgramRegistry } from '../admin/patientMerge/setupProgramRegistry';
import { REGISTRATION_STATUSES } from '@tamanu/constants';

describe('PatientProgramRegistration', () => {
  let ctx;
  let models;
  let clinician;
  let programRegistry;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    clinician = await models.User.create(fake(models.User));
    programRegistry = await setupProgramRegistry(models);
  });
  afterAll(() => ctx.close());

  it('always generates an id combining the patient id and program registry id', async () => {
    const { Patient, PatientProgramRegistration } = models;
    const patient = await Patient.create(fake(models.Patient));
    const registration = await PatientProgramRegistration.create({
      patientId: patient.id,
      programRegistryId: programRegistry.id,
      date: '2023-09-04 08:00:00',
      registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      clinicianId: clinician.id,
    });

    const expectedId = `${patient.id.replaceAll(';', ':')};${programRegistry.id.replaceAll(';', ':')}`;
    expect(registration.id).toBeDefined();
    expect(registration.id).toBe(expectedId);
  });

  it('should not allow duplicate registrations for the same patient and program registry', async () => {
    const { Patient, PatientProgramRegistration } = models;
    const patient = await Patient.create(fake(models.Patient));
    await PatientProgramRegistration.create({
      patientId: patient.id,
      programRegistryId: programRegistry.id,
      date: '2023-09-04 08:00:00', 
      registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      clinicianId: clinician.id,
    });

    await expect(PatientProgramRegistration.create({
      patientId: patient.id,
      programRegistryId: programRegistry.id,
      date: '2023-09-05 08:00:00',
      registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      clinicianId: clinician.id,
    })).rejects.toThrow();
  });
});
