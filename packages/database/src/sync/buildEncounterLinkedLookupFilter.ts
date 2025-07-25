import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';
import { isObject } from 'lodash';

export type JoinConfig = {
  tableName: string;
  columnName: string;
};

/**
 * Helper function to determine if a facility_id should be populated in sync lookup
 * Only populates facility_id when the encounter is from a sensitive facility
 * This ensures sensitive encounters are only synced to their originating facility
 */
export function addSensitiveFacilityIdIfApplicable() {
  return `
    CASE
      WHEN facilities.is_sensitive = TRUE THEN facilities.id
      ELSE NULL
    END
  `;
}

// TODO: a bit hacky for my liking. have moved all the weird logic here but now i need to polish a bit
export function buildEncounterLinkedLookupFilter(
  model: typeof Model,
  options?: {
    patientId?: string; // override the default patient_id relationship (encounters.patient_id)
    extraJoins?: (string | JoinConfig)[]; // extra joins needed to traverse between this model and the encounters table
    isLabRequest?: boolean; // If the model should sync down with syncAllLabRequests setting
  },
) {
  const { extraJoins, isLabRequest, patientId = 'encounters.patient_id' } = options ?? {};

  const select = buildSyncLookupSelect(model, {
    patientId,
    facilityId: addSensitiveFacilityIdIfApplicable(),
    isLabRequestValue: isLabRequest ? 'TRUE' : 'FALSE',
  });

  const includeDefaultEncounterJoin = !extraJoins?.find(
    join => isObject(join) && join.tableName === 'encounters',
  );

  const joins = buildEncounterLinkedSyncFilterJoins([
    model.tableName,
    ...(extraJoins || []),
    ...(includeDefaultEncounterJoin ? ['encounters'] : []),
    'locations',
    'facilities',
  ]);

  return { select, joins };
}
