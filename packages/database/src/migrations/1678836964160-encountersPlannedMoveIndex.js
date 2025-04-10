export async function up(query) {
  await query.addIndex('encounters', ['planned_location_start_time']);
}

export async function down(query) {
  await query.removeIndex('encounters', ['planned_location_start_time']);
}
