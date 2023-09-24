export async function up(query) {
  await query.sequelize.query(`
    UPDATE survey_response_answers as sra
    SET body = ('["' || REPLACE(sra.body, ', ', '","') || '"]')
    WHERE data_element_id IN (
        SELECT survey_response_answers.data_element_id
        FROM survey_response_answers
        JOIN program_data_elements ON survey_response_answers.data_element_id = program_data_elements.id
        WHERE program_data_elements.type = 'MultiSelect'
    );
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    UPDATE survey_response_answers as sra
    SET body = REPLACE(REPLACE(REPLACE(sra.body, '["', ''), '"]', ''), '","', ', ')
    WHERE data_element_id IN (
      SELECT survey_response_answers.data_element_id
      FROM survey_response_answers
      JOIN program_data_elements ON survey_response_answers.data_element_id = program_data_elements.id
      WHERE program_data_elements.type = 'MultiSelect'
    );
  `);
}
