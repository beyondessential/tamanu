export function up(query) {
  return query.addIndex('encounters', ['planned_location_start_time']);
}

export function down(query) {
  return query.removeIndex('encounters', ['planned_location_start_time']);
}
