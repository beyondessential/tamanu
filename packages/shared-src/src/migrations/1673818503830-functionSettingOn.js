export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION setting_on(
      path TEXT,
      facility VARCHAR(255) = NULL
    )
      RETURNS BOOLEAN
      LANGUAGE SQL
      STABLE
      PARALLEL SAFE
    AS $$
      SELECT value = 'true'
      FROM settings WHERE key = path
      WHERE deleted_at IS NULL
      AND (facility_id IS NULL OR facility_id = facility)
      ORDER BY facility_id DESC LIMIT 1 -- prefer facility-specific setting when both matched
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS setting_on`);
}
