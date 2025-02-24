import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateProgramRegistryDataParams {
  models: Models;
  userId: string;
  patientId: string;
  programRegistryId: string;
}
export const createProgramRegistryData = async ({
  models: { PatientProgramRegistration, PatientProgramRegistrationCondition },
  userId,
  patientId,
  programRegistryId,
}: CreateProgramRegistryDataParams): Promise<void> => {
  await PatientProgramRegistration.create(
    fake(PatientProgramRegistration, {
      clinicianId: userId,
      patientId,
      programRegistryId,
    }),
  );
  await PatientProgramRegistrationCondition.create(
    fake(PatientProgramRegistrationCondition, {
      patientId,
      programRegistryId,
    }),
  );
};
