import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateAdministeredVaccineDataParams {
  models: Models;
  scheduledVaccineId: string;
  encounterId: string;
}
export const createAdministeredVaccine = async ({
  models: { AdministeredVaccine },
  scheduledVaccineId,
  encounterId,
}: CreateAdministeredVaccineDataParams): Promise<void> => {
  await AdministeredVaccine.create(
    fake(AdministeredVaccine, {
      scheduledVaccineId,
      encounterId,
    }),
  );
};
