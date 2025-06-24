import { fake } from '@tamanu/fake-data/fake';

import { mergePatient } from '../../../dist/admin/patientMerge/mergePatient';
import { createTestContext } from '../../utilities';
import { makeTwoPatients } from './makeTwoPatients';
import { setupProgramRegistry } from './setupProgramRegistry';
import { REGISTRATION_STATUSES } from '@tamanu/constants';

describe('Merging Patient Program Registration Conditions', () => {
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

  afterAll(async () => {
    await ctx.close();
  });

  it('hard deletes all conditions', async () => {
    const { PatientProgramRegistration, PatientProgramRegistrationCondition } = models;
    const [keep, merge] = await makeTwoPatients(models);

    const keepRegistration = await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        patientId: keep.id,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
      }),
    );

    const unwantedRegistration = await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        patientId: merge.id,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
      }),
    );

    // Keep patient has 1 condition
    const keepCondition = await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: keepRegistration.id,
      }),
    );

    // Merge patient has 2 conditions
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: unwantedRegistration.id,
      }),
    );
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: unwantedRegistration.id,
      }),
    );

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 2,
      PatientProgramRegistration: 1,
    });

    const newKeepPatientConditions = await PatientProgramRegistrationCondition.findAll({
      where: { patientProgramRegistrationId: keepRegistration.id },
      paranoid: false, // include any soft deleted conditions
      raw: true,
    });
    const newMergePatientConditions = await PatientProgramRegistrationCondition.findAll({
      where: { patientProgramRegistrationId: unwantedRegistration.id },
      paranoid: false, // include any soft deleted conditions
      raw: true,
    });

    expect(newKeepPatientConditions.length).toEqual(1);
    expect(newMergePatientConditions.length).toEqual(0);

    const afterMergeKeepCondition = newKeepPatientConditions[0];
    expect(afterMergeKeepCondition.id).toBe(keepCondition.id);
    expect(afterMergeKeepCondition.deletedAt).toBeNull();
  });
});
