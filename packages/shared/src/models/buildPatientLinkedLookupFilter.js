import { buildExtraFilterColumnSelect } from './buildExtraFilterColumnSelect';

export function buildPatientLinkedLookupFilter(tableName) {
  return {
    extraFilterColumnSelect: buildExtraFilterColumnSelect({
      patientId: `${tableName}.patient_id`,
    }),
  };
}
