
import type { Model } from 'models';
import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';

export function buildEncounterLinkedLookupFilter(model: typeof Model) {
  return {
    select: buildSyncLookupSelect(model, {
      patientId: 'encounters.patient_id',
    }),
    joins: buildEncounterLinkedSyncFilterJoins([model.tableName, 'encounters']),
  };
}
