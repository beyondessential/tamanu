import type { Model } from '../models/Model.ts';
import { buildSyncLookupSelect } from './buildSyncLookupSelect.ts';

export async function buildPatientLinkedLookupFilter(model: typeof Model) {
  return {
    select: await buildSyncLookupSelect(model, {
      patientId: `${model.tableName}.patient_id`,
    }),
  };
}

export async function buildEncounterPatientIdSelect(model: typeof Model) {
  return buildSyncLookupSelect(model, {
    patientId: 'encounters.patient_id',
  });
}
