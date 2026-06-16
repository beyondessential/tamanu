import { randomRecordId } from '../randomRecord.ts';

import { fake, chance, fakeDate } from '../../fake/index.ts';
import type { CommonParams } from './common.ts';

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
      date: fakeDate().toISOString(),
      completed: chance.bool(),
    }),
  );
};
