import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';

/**
 * Helper function to determine if a facility_id should be populated in sync lookup
 * Only populates facility_id when the encounter is from a sensitive facility
 * This ensures sensitive encounters are only synced to their originating facility
 */
function addSensitiveFacilityIdIfApplicable() {
  return `
    CASE
      WHEN facilities.is_sensitive = TRUE THEN facilities.id
      ELSE NULL
    END
  `;
}

export function buildEncounterLinkedLookupFilter(model: typeof Model, extraJoins?: string[]) {
  return {
    select: buildSyncLookupSelect(model, {
      patientId: 'encounters.patient_id',
      // Only populate facility_id when the encounter is from a sensitive facility
      // This ensures sensitive encounters are only synced to their originating facility
      facilityId: addSensitiveFacilityIdIfApplicable(),
    }),
    joins: buildEncounterLinkedSyncFilterJoins([
      model.tableName,
      ...(extraJoins || []),
      'encounters',
      'locations',
      'facilities',
    ]),
  };
}
