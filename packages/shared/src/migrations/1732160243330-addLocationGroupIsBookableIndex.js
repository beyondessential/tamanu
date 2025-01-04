export async function up(query) {
  await query.addIndex('location_groups', ['is_bookable']);
}

export async function down(query) {
  await query.removeIndex('location_groups', ['is_bookable']);
}
