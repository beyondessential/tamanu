module.exports = {
  up: async query => {
    await query.sequelize.query(`
      ALTER TABLE survey_response_answers
        ALTER body TYPE TEXT
    `);
  },
  down: async query => {
    await query.sequelize.query(`
      ALTER TABLE survey_response_answers
        ALTER body TYPE VARCHAR(255)
    `);
  },
};
