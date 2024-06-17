export function buildPatientSyncFilterViaPatientId(patientCount, markedForSyncPatientsTable) {
  if (patientCount === 0) {
    return null;
  }
  return `WHERE patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}) AND updated_at_sync_tick > :since`;
}
