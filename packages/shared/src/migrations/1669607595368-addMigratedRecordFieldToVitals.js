export async function up(query) {
  await query.sequelize.query(`
    ALTER TABLE vitals
    ADD COLUMN "migrated_record" VARCHAR(255)
    REFERENCES survey_responses
    DEFAULT NULL;
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE vitals
    DROP COLUMN "migrated_record"
  `);
}
