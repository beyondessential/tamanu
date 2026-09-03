import {
  buildEncounterLinkedSyncFilterJoins,
  type JoinConfig,
} from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';

/**
 * The network a record's encounter belongs to, scoping it to that network's facilities and no
 * others. Null for an encounter at a facility in no network, which leaves the record unscoped and
 * so reaches everywhere. No CASE is needed: the column is already null for those facilities.
 *
 * A record carries a network or a facility, never both — see specs/sync/sensitive-networks.md.
 */
export const ENCOUNTER_SENSITIVE_NETWORK_ID = 'facilities.sensitive_network_id';

export async function buildEncounterLinkedLookupSelect(
  model: typeof Model,
  extraSelects?: Record<string, string>,
) {
  return await buildSyncLookupSelect(model, {
    patientId: 'encounters.patient_id',
    sensitiveNetworkId: ENCOUNTER_SENSITIVE_NETWORK_ID,
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
