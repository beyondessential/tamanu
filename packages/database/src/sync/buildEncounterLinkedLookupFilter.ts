import {
  buildEncounterLinkedSyncFilterJoins,
  type JoinConfig,
} from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';

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
