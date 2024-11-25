import { buildEncounterLinkedSyncFilterJoins } from '../models/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export function buildEncounterLinkedLookupFilter(model) {
  return {
    select: buildSyncLookupSelect(model, {
      patientId: 'encounters.patient_id',
    }),
    joins: buildEncounterLinkedSyncFilterJoins([model.tableName, 'encounters']),
  };
}
