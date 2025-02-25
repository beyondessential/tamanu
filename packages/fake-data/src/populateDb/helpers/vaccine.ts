import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateAdministeredVaccineParams {
  models: Models;
  scheduledVaccineId: string;
  encounterId: string;
}
export const createAdministeredVaccine = async ({
  models: { AdministeredVaccine },
  scheduledVaccineId,
  encounterId,
}: CreateAdministeredVaccineParams): Promise<void> => {
  await AdministeredVaccine.create(
    fake(AdministeredVaccine, {
      scheduledVaccineId,
      encounterId,
    }),
  );
};
