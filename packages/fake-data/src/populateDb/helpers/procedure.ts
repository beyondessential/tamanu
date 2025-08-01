import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateProcedureParams extends CommonParams {
  encounterId: string;
}
export const createProcedure = async ({
  models,
  encounterId,
}: CreateProcedureParams): Promise<void> => {
  const { Procedure } = models;
  await Procedure.create(
    fake(Procedure, {
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );
};
