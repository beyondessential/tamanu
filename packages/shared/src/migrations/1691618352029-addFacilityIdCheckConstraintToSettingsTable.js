export async function up(query) {
  await query.sequelize.query(`
    ALTER TABLE settings ADD CONSTRAINT check_facility_id CHECK (
      (scope = 'facility' AND facility_id IS NOT NULL) OR
      (scope <> 'facility' AND facility_id IS NULL))`);
}

export async function down(query) {
  await query.removeConstraint('settings', 'check_facility_id');
}
