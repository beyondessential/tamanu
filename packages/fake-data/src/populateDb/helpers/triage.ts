import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateTriageParams extends CommonParams {
  encounterId?: string;
  practitionerId?: string;
}
export const createTriage = async ({
  models,
  encounterId,
  practitionerId,
}: CreateTriageParams): Promise<void> => {
  const { Triage } = models;

  // Triage.create has business logic that creates an encounter as part of the
  // triage workflow — bypass it with build().save() for seeding.
  await Triage.build(
    fake(Triage, {
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
      practitionerId: practitionerId || (await randomRecordId(models, 'User')),
      score: chance.pickone(['1', '2', '3', '4', '5']),
    }),
  ).save();
};
