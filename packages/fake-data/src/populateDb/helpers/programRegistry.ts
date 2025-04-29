import { times } from 'lodash';
import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

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
  const { PatientProgramRegistration, PatientProgramRegistrationCondition } = models;

  await PatientProgramRegistration.create(
    fake(PatientProgramRegistration, {
      clinicianId: userId,
      patientId,
      programRegistryId,
    }),
  );
  await Promise.all(
    times(conditionCount, () =>
      limit(async () => {
        await PatientProgramRegistrationCondition.create(
          fake(PatientProgramRegistrationCondition, {
            patientId,
            programRegistryId,
          }),
        );
      }),
    ),
  );
};
