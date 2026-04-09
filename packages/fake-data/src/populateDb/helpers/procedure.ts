import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateProcedureParams extends CommonParams {
  encounterId?: string;
  locationId?: string;
  physicianId?: string;
}
export const createProcedure = async ({
  models,
  encounterId,
  locationId,
  physicianId,
}: CreateProcedureParams): Promise<void> => {
  const { Procedure } = models;

  await Procedure.create(
    fake(Procedure, {
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
      locationId: locationId || (await randomRecordId(models, 'Location')),
      physicianId: physicianId || (await randomRecordId(models, 'User')),
      date: chance.date({ year: 2024 }).toISOString(),
      completed: chance.bool(),
    }),
  );
};
