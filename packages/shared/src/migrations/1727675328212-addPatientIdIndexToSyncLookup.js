export async function up(query) {
  await query.addIndex('sync_lookup', {
    fields: ['patient_id'],
  });
}

export async function down(query) {
  await query.removeIndex('sync_lookup', ['patient_id']);
}
