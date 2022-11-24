export async function up(query) {
  // write your up migration here
  await query.sequelize.query(`
    CREATE UNIQUE INDEX surveys_only_one_vitals ON surveys (survey_type) WHERE survey_type = 'vitals';
  `);
}

export async function down(query) {
  // write your down migration here
  await query.sequelize.query(`
    ALTER TABLE surveys DROP CONSTRAINT surveys_only_one_vitals;
  `);
}
