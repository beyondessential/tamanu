export async function up(query) {
  await query.addIndex('sync_lookup', {
    fields: ['updated_at_sync_tick', 'record_id', 'patient_id', 'facility_id'],
  });
}

export async function down(query) {
  await query.removeIndex(
    'sync_lookup',
    'sync_lookup_updated_at_sync_tick_record_id_patient_id_facility_id',
  );
}
