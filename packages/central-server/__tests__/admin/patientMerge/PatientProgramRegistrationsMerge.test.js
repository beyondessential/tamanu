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
  let clinician;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    clinician = await models.User.create(fake(models.User));
    programRegistry = await setupProgramRegistry(models);
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('soft deletes and moves all registrations to keep patients', async () => {
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
    const unwantedRegistration1 = await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
        date: '2023-10-04 08:00:00',
      }),
    );
    const unwantedRegistration2 = await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
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
      raw: true,
    });

    expect(newKeepPatientRegistrations.length).toEqual(3);
    expect(newMergePatientRegistrations.length).toEqual(0);

    const afterMergeKeepRegistration = newKeepPatientRegistrations.find(
      (r) => r.id === keepRegistration.id,
    );
    const afterMergeUnwantedRegistration1 = newKeepPatientRegistrations.find(
      (r) => r.id === unwantedRegistration1.id,
    );
    const afterMergeUnwantedRegistration2 = newKeepPatientRegistrations.find(
      (r) => r.id === unwantedRegistration2.id,
    );
    expect(afterMergeKeepRegistration.deletedAt).toBeNull();
    expect(afterMergeUnwantedRegistration1.deletedAt).not.toBeNull();
    expect(afterMergeUnwantedRegistration2.deletedAt).not.toBeNull();
  });
});
