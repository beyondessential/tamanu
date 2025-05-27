import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { mergePatient } from '../../../dist/admin/patientMerge/mergePatient';
import { createTestContext } from '../../utilities';
import { makeTwoPatients } from './makeTwoPatients';
import { setupProgramRegistry } from './setupProgramRegistry';

describe('Merging Patient Program Registrations', () => {
  let ctx;
  let models;
  let programRegistry;
  let secondProgramRegistry;
  let clinician;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    clinician = await models.User.create(fake(models.User));
    programRegistry = await setupProgramRegistry(models);
    secondProgramRegistry = await setupProgramRegistry(models);
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('hard deletes all unwanted registrations', async () => {
    const { PatientProgramRegistration } = models;
    const [keep, merge] = await makeTwoPatients(models);

    // Keep patient has 1 active registration
    const keepRegistration = await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        patientId: keep.id,
        passport: 'keep-passport',
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
        date: '2023-09-04 08:00:00',
      }),
    );

    // Merge patient has 1 active and 1 inactive registration
    await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
        date: '2023-10-04 08:00:00',
      }),
    );
    await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: secondProgramRegistry.id,
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
        registrationStatus: REGISTRATION_STATUSES.INACTIVE,
        clinicianId: clinician.id,
        date: '2023-11-04 08:00:00',
      }),
    );

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 2,
      PatientProgramRegistration: 2,
    });

    const newKeepPatientRegistrations = await PatientProgramRegistration.findAll({
      where: { patientId: keep.id },
      paranoid: false, // include the soft deleted registrations
      raw: true,
    });
    const newMergePatientRegistrations = await PatientProgramRegistration.findAll({
      where: { patientId: merge.id },
      paranoid: false, // include the soft deleted conditions
      raw: true,
    });

    expect(newKeepPatientRegistrations.length).toEqual(1);
    expect(newMergePatientRegistrations.length).toEqual(0);

    const afterMergeKeepRegistration = newKeepPatientRegistrations[0];
    expect(afterMergeKeepRegistration.id).toBe(keepRegistration.id);
    expect(afterMergeKeepRegistration.deletedAt).toBeNull();
  });
});
