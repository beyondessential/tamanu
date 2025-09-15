import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';

export async function buildEncounterLinkedLookupFilter(model: typeof Model) {
  return {
    select: await buildSyncLookupSelect(model, {
      patientId: 'encounters.patient_id',
    }),
    joins: buildEncounterLinkedSyncFilterJoins([model.tableName, 'encounters']),
  };
}
