export async function up(query) {
  await query.addIndex('sync_lookup', {
    fields: ['updated_at_sync_tick'],
  });
  await query.addIndex('sync_lookup', {
    fields: ['record_id'],
  });
  await query.addIndex('sync_lookup', {
    fields: ['patient_id'],
  });
  await query.addIndex('sync_lookup', {
    fields: ['facility_id'],
  });
  await query.addIndex('sync_lookup', {
    fields: ['encounter_id'],
  });
  await query.addIndex('sync_lookup', {
    fields: ['is_lab_request'],
  });
}

export async function down(query) {
  await query.removeIndex('sync_lookup', 'updated_at_sync_tick');
  await query.removeIndex('sync_lookup', 'record_id');
  await query.removeIndex('sync_lookup', 'patient_id');
  await query.removeIndex('sync_lookup', 'facility_id');
  await query.removeIndex('sync_lookup', 'is_lab_request');
}
