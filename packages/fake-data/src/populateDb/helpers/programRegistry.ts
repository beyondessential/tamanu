import { times } from 'lodash-es';
import { randomRecordId } from '../randomRecord.js';
import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants/programRegistry';

interface CreateProgramRegistryParams extends CommonParams {
  userId?: string;
  patientId?: string;
  programRegistryId?: string;
  conditionCount?: number;
}
export const createProgramRegistry = async ({
  models,
  userId,
  patientId,
  programRegistryId,
  conditionCount = chance.integer({ min: 1, max: 5 }),
}: CreateProgramRegistryParams): Promise<void> => {
  const {
    ProgramRegistryCondition,
    ProgramRegistryConditionCategory,
    PatientProgramRegistration,
    PatientProgramRegistrationCondition,
  } = models;

  const resolvedUserId = userId || (await randomRecordId(models, 'User'));
  const resolvedPatientId = patientId || (await randomRecordId(models, 'Patient'));
  const resolvedRegistryId = programRegistryId || (await randomRecordId(models, 'ProgramRegistry'));

  const { id: patientProgramRegistrationId } = await PatientProgramRegistration.create(
    fake(PatientProgramRegistration, {
      clinicianId: resolvedUserId,
      patientId: resolvedPatientId,
      programRegistryId: resolvedRegistryId,
    }),
  );

  const condition = await ProgramRegistryCondition.create(
    fake(ProgramRegistryCondition, {
      programRegistryId: resolvedRegistryId,
    }),
  );

  // The 'unknown' category is created alongside each ProgramRegistry in
  // generateImportData, so look it up rather than racing to findOrCreate it.
  const conditionCategory = await ProgramRegistryConditionCategory.findOne({
    where: {
      programRegistryId: resolvedRegistryId,
      code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
    },
  });

  for (const _ of times(conditionCount)) {
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientProgramRegistrationId,
        programRegistryConditionId: condition.id,
        programRegistryConditionCategoryId: conditionCategory.id,
        clinicianId: resolvedUserId,
      }),
    );
  }
};
