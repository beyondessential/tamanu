import type { Model } from '../models/Model';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';

export function buildPatientLinkedLookupFilter(model: typeof Model) {
  return {
    select: buildSyncLookupSelect(model, {
      patientId: `${model.tableName}.patient_id`,
    }),
  };
}

export function buildEncounterPatientIdSelect(model: typeof Model) {
  return buildSyncLookupSelect(model, {
    patientId: 'encounters.patient_id',
  });
}
