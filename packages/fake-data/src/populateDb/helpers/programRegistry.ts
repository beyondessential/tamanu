import { times } from 'lodash';
import { randomRecordId } from '@tamanu/database/demoData/utilities';
import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '@tamanu/constants/programRegistry';

interface CreateProgramRegistryParams extends CommonParams {
  userId?: string;
  patientId?: string;
  programRegistryId?: string;
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

  const categoryCode = PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN;
  const conditionCategory = await ProgramRegistryConditionCategory.create(
    fake(ProgramRegistryConditionCategory, {
      id: `program-registry-condition-category-${resolvedRegistryId}-${categoryCode}-${chance.string({ length: 8, alpha: true })}`,
      code: categoryCode,
      name: PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[categoryCode],
      programRegistryId: resolvedRegistryId,
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
