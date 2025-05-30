import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateAdministeredVaccineParams extends CommonParams {
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
      scheduledVaccineId: scheduledVaccineId || (await randomRecordId(models, 'ScheduledVaccine')),
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );
};
