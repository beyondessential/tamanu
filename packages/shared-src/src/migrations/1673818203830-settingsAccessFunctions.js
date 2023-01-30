export async function up(query) {
  // Preliminary function which only works for leaf settings. In the future may
  // work on branch settings and return (possibly nested) JSONB objects.
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION setting_get(
      path TEXT,
      facility VARCHAR(255) = NULL
    )
      RETURNS JSONB
      LANGUAGE SQL
      STABLE
      PARALLEL SAFE
    AS $$
      SELECT value
      FROM settings
      WHERE true
        AND key = path
        AND deleted_at IS NULL
        AND (facility_id IS NULL OR facility_id = facility)
      ORDER BY facility_id DESC LIMIT 1 -- prefer facility-specific setting when both matched
    $$
  `);

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
      SELECT setting_get(path, facility) = 'true'
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS setting_on`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS setting_get`);
}
