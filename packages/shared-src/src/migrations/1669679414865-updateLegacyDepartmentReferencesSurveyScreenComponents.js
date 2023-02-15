// Migrate surveys using reference data with type 'department' to use dedicated department table
export async function up(query) {
  await query.sequelize.query(`
    UPDATE survey_screen_components
    SET config = jsonb_set(
      config::jsonb,
      '{source}',
      CASE
        config::jsonb -> 'where' ->> 'type'
        WHEN 'department' THEN '"Department"'
        WHEN 'facility' THEN '"Facility"'
        WHEN 'location' THEN '"Location"'
      END::jsonb
    ) - 'where'
  WHERE
    config <> ''
    AND config::jsonb ->> 'source' = 'ReferenceData'
    AND config::jsonb -> 'where' ->> 'type' in (
      'department',
      'facility',
      'location'
    )
  `);
}

export async function down() {
  // No down migration
}
