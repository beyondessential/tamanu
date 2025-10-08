import { times } from 'lodash';
import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '@tamanu/constants/programRegistry';

interface CreateProgramRegistryParams extends CommonParams {
  userId: string;
  patientId: string;
  programRegistryId: string;
  conditionCount?: number;
}
export const createProgramRegistry = async ({
  models,
  limit,
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

  const { id: patientProgramRegistrationId } = await PatientProgramRegistration.create(
    fake(PatientProgramRegistration, {
      clinicianId: userId,
      patientId,
      programRegistryId,
    }),
  );

  const condition = await ProgramRegistryCondition.create(
    fake(ProgramRegistryCondition, {
      programRegistryId,
    }),
  );

  const categoryCode = PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN;
  const conditionCategory = await ProgramRegistryConditionCategory.create(
    fake(ProgramRegistryConditionCategory, {
      id: `program-registry-condition-category-${programRegistryId}-${categoryCode}`,
      code: categoryCode,
      name: PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[categoryCode],
      programRegistryId,
    }),
  );

  await Promise.all(
    times(conditionCount, () =>
      limit(async () => {
        await PatientProgramRegistrationCondition.create(
          fake(PatientProgramRegistrationCondition, {
            patientProgramRegistrationId,
            programRegistryConditionId: condition.id,
            programRegistryConditionCategoryId: conditionCategory.id,
          }),
        );
      }),
    ),
  );
};
