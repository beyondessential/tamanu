export function buildPatientSyncFilterViaPatientId(patientCount) {
  if (patientCount === 0) {
    return null;
  }
  return 'WHERE patient_id IN (SELECT patient_id FROM marked_for_sync_patients) AND updated_at_sync_tick > :since';
}
