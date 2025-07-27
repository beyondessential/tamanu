import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';
import type { Model } from '../models/Model';
import { isObject } from 'lodash';

export type JoinConfig = {
  tableName: string;
  columnName: string;
  joinType?: 'LEFT' | 'INNER';
};

export type Options = {
  patientId?: string; // override the default patient_id relationship (encounters.patient_id)
  extraJoins?: (string | JoinConfig)[]; // extra joins needed to traverse between this model and the encounters table
  isLabRequest?: boolean; // If the model should sync down with syncAllLabRequests setting
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

export function buildEncounterLinkedLookupFilter(model: typeof Model, options?: Options) {
  const { extraJoins, isLabRequest, patientId = 'encounters.patient_id' } = options ?? {};

  const select = buildSyncLookupSelect(model, {
    patientId,
    facilityId: addSensitiveFacilityIdIfApplicable(),
    isLabRequestValue: isLabRequest ? 'TRUE' : 'FALSE',
  });

  // We need to allow an object override for the encounter join if the column name is not encounter_id
  const includeDefaultEncounterJoin = !extraJoins?.find(
    join => join === 'encounters' || (isObject(join) && join.tableName === 'encounters'),
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
