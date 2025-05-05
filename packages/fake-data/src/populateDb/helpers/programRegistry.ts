import type { Models } from '@tamanu/database';
import { times } from 'lodash';
import { fake, chance } from '../../fake';

interface CreateProgramRegistryParams {
  models: Models;
  userId: string;
  patientId: string;
  programRegistryId: string;
  conditionCount?: number;
}
export const createProgramRegistry = async ({
  models,
  userId,
  patientId,
  programRegistryId,
  conditionCount = chance.integer({ min: 1, max: 5 }),
}: CreateProgramRegistryParams): Promise<void> => {
  const { PatientProgramRegistration, PatientProgramRegistrationCondition } = models;

  const { id: patientProgramRegistrationId } = await PatientProgramRegistration.create(
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
        patientProgramRegistrationId,
      }),
    );
  });
};
