export async function up(query) {

  await query.sequelize.query(`
    ALTER TABLE attachments
      ADD COLUMN title VARCHAR(255);
  `);

}

export async function down(query) {

  await query.sequelize.query(`
    ALTER TABLE attachments
      DROP COLUMN title
  `);

}
