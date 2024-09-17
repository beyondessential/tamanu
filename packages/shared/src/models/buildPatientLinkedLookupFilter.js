import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export function buildPatientLinkedLookupFilter(model) {
  return {
    select: buildSyncLookupSelect(model, {
      patientId: `${model.tableName}.patient_id`,
    }),
  };
}

export function buildEncounterPatientIdSelect(model) {
  return buildSyncLookupSelect(model, {
    patientId: 'encounters.patient_id',
  });
}
