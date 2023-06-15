export async function up(query) {
  // Get rid of all records except one per user ID
  const temporaryTable = `temp_table_user_localisation_caches_${Date.now()}`;
  await query.sequelize.query(`
  CREATE TABLE ${temporaryTable} AS
    (SELECT *
    FROM user_localisation_caches
    WHERE id IN (
      SELECT DISTINCT ON (user_id) id
      FROM user_localisation_caches
      WHERE localisation IS NOT NULL
      ORDER BY user_id, created_at DESC
    ));
  `);
  await query.sequelize.query(`TRUNCATE TABLE user_localisation_caches`); // this bit destructive, can't be downed
  await query.sequelize.query(`
    INSERT INTO user_localisation_caches
    SELECT * FROM ${temporaryTable};
  `);
  await query.sequelize.query(`DROP TABLE ${temporaryTable}`);

  await query.addIndex('user_localisation_caches', {
    fields: ['user_id'],
    unique: true,
  });
}

export async function down(query) {
  await query.removeIndex('user_localisation_caches', ['user_id']);
}
