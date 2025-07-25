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
    extraJoins?: (string | JoinConfig)[]; // extra joins needed to traverse between this model and the encounters table
    isLabRequest?: boolean; // If the model should sync down with syncAllLabRequests setting
    patientIdOverride?: string;
  },
) {
  const { extraJoins, isLabRequest, patientIdOverride } = options || {};
  const isEncounterJoinOverridden = extraJoins?.find(
    join => isObject(join) && join.tableName === 'encounters',
  );

  return {
    select: buildSyncLookupSelect(model, {
      patientId: patientIdOverride || 'encounters.patient_id',
      // Only populate facility_id when the encounter is from a sensitive facility
      // This ensures sensitive encounters are only synced to their originating facility
      facilityId: addSensitiveFacilityIdIfApplicable(),
      isLabRequestValue: isLabRequest ? 'TRUE' : 'FALSE',
    }),
    joins: buildEncounterLinkedSyncFilterJoins([
      model.tableName,
      ...(extraJoins || []),
      ...(isEncounterJoinOverridden ? [] : ['encounters']),
      'locations',
      'facilities',
    ]),
  };
}
