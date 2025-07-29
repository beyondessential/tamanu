import {
  buildEncounterLinkedSyncFilterJoins,
  type JoinConfig,
} from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';

/**
 * Helper to determine if a facility_id should be populated in sync lookup
 * Only populates facility_id when the encounter is from a sensitive facility
 * This ensures sensitive encounters are only synced to their originating facility
 */
const addSensitiveFacilityIdIfApplicable = `
    CASE
      WHEN facilities.is_sensitive = TRUE THEN facilities.id
      ELSE NULL
    END
  `;

export function buildEncounterLinkedLookupSelect(
  model: typeof Model,
  extraSelects?: Record<string, string>,
) {
  return buildSyncLookupSelect(model, {
    patientId: 'encounters.patient_id',
    facilityId: addSensitiveFacilityIdIfApplicable,
    ...extraSelects,
  });
}

export function buildEncounterLinkedLookupJoins(
  model: typeof Model,
  joinsToEncounters?: JoinConfig[],
) {
  return buildEncounterLinkedSyncFilterJoins([
    model.tableName,
    ...(joinsToEncounters || ['encounters']),
    'locations',
    'facilities',
  ]);
}

export function buildEncounterLinkedLookupFilter(model: typeof Model) {
  return {
    select: buildEncounterLinkedLookupSelect(model),
    joins: buildEncounterLinkedLookupJoins(model),
  };
}
