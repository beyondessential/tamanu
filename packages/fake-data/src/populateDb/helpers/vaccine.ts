import { randomRecordId } from '../randomRecord.ts';

import { fake } from '../../fake/index.ts';
import type { CommonParams } from './common.ts';

interface CreateAdministeredVaccineParams extends CommonParams {
  scheduledVaccineId?: string;
  encounterId?: string;
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
      recorderId: await randomRecordId(models, 'User'),
    }),
  );
};
