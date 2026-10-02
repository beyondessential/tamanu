import {
  buildEncounterLinkedSyncFilterJoins,
  type JoinConfig,
} from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';

export async function buildEncounterLinkedLookupSelect(
  model: typeof Model,
  extraSelects?: Record<string, string>,
) {
  return await buildSyncLookupSelect(model, {
    patientId: 'encounters.patient_id',
    sensitiveNetworkId: 'facilities.sensitive_network_id',
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
