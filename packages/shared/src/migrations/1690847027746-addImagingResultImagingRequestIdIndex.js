export async function up(query) {
  await query.addIndex('imaging_results', {
    fields: ['imaging_request_id'],
  });
}

export async function down(query) {
  await query.removeIndex('imaging_results', ['imaging_request_id']);
}
