import type { Models } from '@tamanu/database';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake } from '../../fake';

interface CreateAdministeredVaccineParams {
  models: Models;
  scheduledVaccineId: string;
  encounterId: string;
}
export const createAdministeredVaccine = async ({
  models,
  scheduledVaccineId,
  encounterId,
}: CreateAdministeredVaccineParams): Promise<void> => {
  const { AdministeredVaccine } = models;
  await AdministeredVaccine.create(
    fake(AdministeredVaccine, {
      scheduledVaccineId,
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );
};
