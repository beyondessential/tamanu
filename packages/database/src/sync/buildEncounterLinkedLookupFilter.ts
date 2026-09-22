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
 *
 * A facility is sensitive exactly when it belongs to a sensitive network
 * (spec: specs/sync/sensitive-networks.md)
 */
export const ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE = `
    CASE
      WHEN facilities.sensitive_network_id IS NOT NULL THEN facilities.id
      ELSE NULL
    END
  `;

export async function buildEncounterLinkedLookupSelect(
  model: typeof Model,
  extraSelects?: Record<string, string>,
) {
  return await buildSyncLookupSelect(model, {
    patientId: 'encounters.patient_id',
    facilityId: ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE,
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

export async function buildEncounterLinkedLookupFilter(
  model: typeof Model,
  joinsToEncounters?: JoinConfig[],
) {
  return {
    select: await buildEncounterLinkedLookupSelect(model),
    joins: buildEncounterLinkedLookupJoins(model, joinsToEncounters),
  };
}
