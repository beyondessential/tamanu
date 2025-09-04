import type { Model } from '../models/Model';
import { buildSyncLookupSelect } from './buildSyncLookupSelect';

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
