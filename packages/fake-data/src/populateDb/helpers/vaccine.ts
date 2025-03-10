import type { Models } from '@tamanu/database';
import { fake } from '../../fake';

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
