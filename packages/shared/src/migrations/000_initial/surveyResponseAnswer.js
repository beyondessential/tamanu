module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    name: Sequelize.STRING,
    body: Sequelize.STRING,
    responseId: foreignKey('SurveyResponse'),
    dataElementId: foreignKey('ProgramDataElement'),
  },
});
