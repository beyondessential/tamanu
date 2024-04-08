export async function up(query) {
  await query.sequelize.query(`
    UPDATE survey_response_answers
    SET body = ''
    WHERE body = 'null'
  `);
}

export async function down() {
  // No down as is a data correction
  return null;
}
