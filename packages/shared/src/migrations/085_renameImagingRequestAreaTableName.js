export async function up(query) {
  await query.renameTable('imaging_request_area', 'imaging_request_areas');
}

export async function down(query) {
  await query.renameTable('imaging_request_areas', 'imaging_request_area');
}
