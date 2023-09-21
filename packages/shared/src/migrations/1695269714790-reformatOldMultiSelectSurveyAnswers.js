export async function up(query) {
  await query.sequelize.query(`
    UPDATE 
      survey_response_answers AS sra
    SET 
      body = REPLACE(sra.body, ', ', '#$*@^')
    FROM 
      survey_response_answers
      JOIN program_data_elements ON survey_response_answers.data_element_id = program_data_elements.id
    WHERE
      program_data_elements.type = 'MultiSelect';
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    UPDATE 
      survey_response_answers AS sra
    SET 
      body = REPLACE(sra.body, '#$*@^', ', ')
    FROM 
      survey_response_answers
      JOIN program_data_elements ON survey_response_answers.data_element_id = program_data_elements.id
    WHERE
      program_data_elements.type = 'MultiSelect';
  `);
}
