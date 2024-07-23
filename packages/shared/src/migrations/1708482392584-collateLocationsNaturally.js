export async function up(query) {
  // Create a lang=en collation that sorts numbers naturally
  await query.sequelize.query(`
    CREATE COLLATION en_numeric (provider = icu, locale = 'en@colNumeric=yes');
  `);

  // Apply natural sorting order to locations and areas
  await query.sequelize.query(
    'ALTER TABLE locations ALTER COLUMN name TYPE character varying(255) COLLATE en_numeric',
  );
  await query.sequelize.query(
    'ALTER TABLE location_groups ALTER COLUMN name TYPE character varying(255) COLLATE en_numeric',
  );
}

export async function down(query) {
  await query.sequelize.query(
    'ALTER TABLE locations ALTER COLUMN name TYPE character varying(255) COLLATE "default"',
  );
  await query.sequelize.query(
    'ALTER TABLE location_groups ALTER COLUMN name TYPE character varying(255) COLLATE "default"',
  );

  await query.sequelize.query('DROP COLLATION en_numeric;');
}
