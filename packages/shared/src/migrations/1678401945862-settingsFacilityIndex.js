export async function up(query) {
  return query.sequelize.query(`
    CREATE INDEX settings_facility_coalesced_idx ON settings (coalesce(facility_id, '###') ASC);
  `);
}

export async function down(query) {
  return query.sequelize.query(`
    DROP INDEX settings_facility_coalesced_idx;
  `);
}
