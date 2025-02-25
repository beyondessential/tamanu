import type { Models } from '@tamanu/database';
import { times } from 'lodash';
const { fake, chance } = require('@tamanu/shared/test-helpers/fake');

interface CreateProgramRegistryParams {
  models: Models;
  userId: string;
  patientId: string;
  programRegistryId: string;
  conditionCount?: number;
}
export const createProgramRegistry = async ({
  models: { PatientProgramRegistration, PatientProgramRegistrationCondition },
  userId,
  patientId,
  programRegistryId,
  conditionCount = chance({ min: 1, max: 5 }),
}: CreateProgramRegistryParams): Promise<void> => {
  await PatientProgramRegistration.create(
    fake(PatientProgramRegistration, {
      clinicianId: userId,
      patientId,
      programRegistryId,
    }),
  );
  times(conditionCount, async () => {
    await PatientProgramRegistrationCondition.create(
      fake(PatientProgramRegistrationCondition, {
        patientId,
        programRegistryId,
      }),
    );
  });
};
