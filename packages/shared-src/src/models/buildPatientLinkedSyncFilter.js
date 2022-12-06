export function buildPatientLinkedSyncFilter(patientIds) {
  if (patientIds.length === 0) {
    return null;
  }
  return 'WHERE patient_id IN (:patientIds) AND updated_at_sync_tick > :since';
}
