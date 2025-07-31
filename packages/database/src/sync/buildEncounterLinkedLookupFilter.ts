import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';

export function buildEncounterLinkedLookupFilter(model: typeof Model) {
  return {
    select: buildSyncLookupSelect(model, {
      patientId: 'encounters.patient_id',
    }),
    joins: buildEncounterLinkedSyncFilterJoins([model.tableName, 'encounters']),
  };
}
