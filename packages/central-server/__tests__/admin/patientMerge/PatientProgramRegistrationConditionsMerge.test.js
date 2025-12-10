import { capitalize } from 'lodash';
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

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    clinician = await models.User.create(fake(models.User));
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('soft deletes all conditions from duplicate registrations', async () => {
    const { PatientProgramRegistration, PatientProgramRegistrationCondition } = models;
    const [keep, merge] = await makeTwoPatients(models);
    const programRegistry = await setupProgramRegistry(models);
    const prCondition1 = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, {
        programRegistryId: programRegistry.id,
      }),
    );
    const prCondition2 = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, {
        programRegistryId: programRegistry.id,
      }),
    );
    const categoryCode = 'unknown';
    const prConditionCategory = await models.ProgramRegistryConditionCategory.create(
      fake(models.ProgramRegistryConditionCategory, {
        id: `program-registry-condition-category-${programRegistry.id}-${categoryCode}`,
        code: categoryCode,
        name: capitalize(categoryCode),
        programRegistryId: programRegistry.id,
      }),
    );

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
        programRegistryConditionId: prCondition1.id,
        programRegistryConditionCategoryId: prConditionCategory.id,
      }),
    );

    // Merge patient has 2 conditions
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: unwantedRegistration.id,
        programRegistryConditionId: prCondition1.id,
        programRegistryConditionCategoryId: prConditionCategory.id,
      }),
    );
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: unwantedRegistration.id,
        programRegistryConditionId: prCondition2.id,
        programRegistryConditionCategoryId: prConditionCategory.id,
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
    expect(newMergePatientConditions.length).toEqual(2);

    const afterMergeKeepCondition = newKeepPatientConditions[0];
    expect(afterMergeKeepCondition.id).toBe(keepCondition.id);
    expect(afterMergeKeepCondition.deletedAt).toBeNull();
  });

  it('keeps all conditions from non-duplicate registrations', async () => {
    const { PatientProgramRegistration, PatientProgramRegistrationCondition } = models;
    const [keep, merge] = await makeTwoPatients(models);
    const programRegistry = await setupProgramRegistry(models);
    const pr1Condition = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, {
        programRegistryId: programRegistry.id,
      }),
    );
    const categoryCode = 'unknown';
    const pr1ConditionCategory = await models.ProgramRegistryConditionCategory.create(
      fake(models.ProgramRegistryConditionCategory, {
        id: `program-registry-condition-category-${programRegistry.id}-${categoryCode}`,
        code: categoryCode,
        name: capitalize(categoryCode),
        programRegistryId: programRegistry.id,
      }),
    );
    const programRegistry2 = await setupProgramRegistry(models);
    const pr2Condition = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, {
        programRegistryId: programRegistry2.id,
      }),
    );
    const pr2ConditionCategory = await models.ProgramRegistryConditionCategory.create(
      fake(models.ProgramRegistryConditionCategory, {
        id: `program-registry-condition-category-${programRegistry2.id}-${categoryCode}`,
        code: categoryCode,
        name: capitalize(categoryCode),
        programRegistryId: programRegistry2.id,
      }),
    );

    const keepRegistration = await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry.id,
        patientId: keep.id,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
      }),
    );

    const mergeRegistration = await PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        programRegistryId: programRegistry2.id,
        patientId: merge.id,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        clinicianId: clinician.id,
      }),
    );

    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: keepRegistration.id,
        programRegistryConditionId: pr1Condition.id,
        programRegistryConditionCategoryId: pr1ConditionCategory.id,
      }),
    );

    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId: mergeRegistration.id,
        programRegistryConditionId: pr2Condition.id,
        programRegistryConditionCategoryId: pr2ConditionCategory.id,
      }),
    );

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 2,
      PatientProgramRegistration: 1,
    });

    const registryOneConditions = await PatientProgramRegistrationCondition.findAll({
      where: { patientProgramRegistrationId: keepRegistration.id },
      paranoid: false, // include any soft deleted conditions
      raw: true,
    });
    const newRegistrationId = `${keep.id};${programRegistry2.id}`;
    const registryTwoConditions = await PatientProgramRegistrationCondition.findAll({
      where: { patientProgramRegistrationId: newRegistrationId },
      paranoid: false, // include any soft deleted conditions
      raw: true,
    });
    const oldRegistryConditions = await PatientProgramRegistrationCondition.findAll({
      where: { patientProgramRegistrationId: mergeRegistration.id },
      paranoid: false, // include any soft deleted conditions
      raw: true,
    });

    expect(registryOneConditions.length).toEqual(1);
    expect(registryTwoConditions.length).toEqual(1);
    expect(oldRegistryConditions.length).toEqual(0);

    expect(registryOneConditions[0].deletedAt).toBeNull();
    expect(registryTwoConditions[0].deletedAt).toBeNull();
  });
});
