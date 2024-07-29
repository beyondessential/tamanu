import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildExtraFilterColumnSelect } from './buildExtraFilterColumnSelect';

export function buildEncounterLinkedLookupFilter() {
  return {
    extraFilterColumnSelect: buildExtraFilterColumnSelect({
      patientId: 'encounters.patient_id',
    }),
    joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
  };
}
