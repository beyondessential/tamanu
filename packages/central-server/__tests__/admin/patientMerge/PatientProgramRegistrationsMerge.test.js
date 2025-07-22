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

  it('soft deletes all duplicate unwanted registrations', async () => {
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
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
        date: '2023-10-04 08:00:00',
      }),
    );
    await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: secondProgramRegistry.id,
        patientId: merge.id,
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
      paranoid: false, // include any soft deleted registrations
      raw: true,
    });
    const newMergePatientRegistrations = await PatientProgramRegistration.findAll({
      where: { patientId: merge.id },
      paranoid: false, // include any soft deleted registrations
      raw: true,
    });

    expect(newKeepPatientRegistrations.length).toEqual(2);
    expect(newMergePatientRegistrations.length).toEqual(2);

    const firstRegistration = newKeepPatientRegistrations.find(
      r => r.programRegistryId === programRegistry.id,
    );
    const secondRegistration = newKeepPatientRegistrations.find(
      r => r.programRegistryId === secondProgramRegistry.id,
    );

    expect(firstRegistration.id).toBe(keepRegistration.id);
    expect(firstRegistration.deletedAt).toBeNull();

    const expectedId = `${keep.id};${secondProgramRegistry.id}`;
    expect(secondRegistration.id).toBe(expectedId);
    expect(secondRegistration.patientId).toBe(keep.id);
    expect(secondRegistration.deletedAt).toBeNull();
  });
});
