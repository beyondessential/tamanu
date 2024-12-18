// We had a "rename" patient merge strategy, which didn't soft delete merged patients
// instead, it just renamed them to "Delete Patient". This migration ensures that all
// patients that were merged with said strategy are properly deleted.
export async function up(query) {
  await query.sequelize.query(`
    UPDATE patients
    SET deleted_at = updated_at
    WHERE merged_into_id IS NOT NULL AND deleted_at IS NULL
  `);
}

export async function down() {
  // destructive up, no possible down
}
