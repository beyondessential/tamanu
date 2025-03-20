import { fake } from '@tamanu/fake-data/fake';

import { mergePatient } from '../../../dist/admin/patientMerge/mergePatient';
import { createTestContext } from '../../utilities';
import { makeTwoPatients } from './makeTwoPatients';
import { setupProgramRegistry } from './setupProgramRegistry';

describe('Merging Patient Program Registration Conditions', () => {
  let ctx;
  let models;
  let programRegistry;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    programRegistry = await setupProgramRegistry(models);
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('soft deletes and moves all conditions to keep patients', async () => {
    const { PatientProgramRegistrationCondition } = models;
    const [keep, merge] = await makeTwoPatients(models);

    // Keep patient has 1 condition
    const keepCondition = await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientId: keep.id,
        programRegistryId: programRegistry.id,
      }),
    );

    // Merge patient has 2 conditions
    const unwantedCondition1 = await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientId: merge.id,
        programRegistryId: programRegistry.id,
      }),
    );
    const unwantedCondition2 = await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientId: merge.id,
        programRegistryId: programRegistry.id,
      }),
    );

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 2,
      PatientProgramRegistrationCondition: 2,
    });

    const newKeepPatientConditions = await PatientProgramRegistrationCondition.findAll({
      where: { patientId: keep.id },
      paranoid: false, // include the soft deleted conditions
      raw: true,
    });
    const newMergePatientConditions = await PatientProgramRegistrationCondition.findAll({
      where: { patientId: merge.id },
      raw: true,
    });

    expect(newKeepPatientConditions.length).toEqual(3);
    expect(newMergePatientConditions.length).toEqual(0);

    const afterMergeKeepCondition = newKeepPatientConditions.find((r) => r.id === keepCondition.id);
    const afterMergeUnwantedCondition1 = newKeepPatientConditions.find(
      (r) => r.id === unwantedCondition1.id,
    );
    const afterMergeUnwantedCondition2 = newKeepPatientConditions.find(
      (r) => r.id === unwantedCondition2.id,
    );
    expect(afterMergeKeepCondition.deletedAt).toBeNull();
    expect(afterMergeUnwantedCondition1.deletedAt).not.toBeNull();
    expect(afterMergeUnwantedCondition2.deletedAt).not.toBeNull();
  });
});
