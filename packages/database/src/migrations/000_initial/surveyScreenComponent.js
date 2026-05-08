module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    screenIndex: Sequelize.INTEGER,
    componentIndex: Sequelize.INTEGER,
    text: Sequelize.STRING,
    visibilityCriteria: Sequelize.STRING,
    validationCriteria: Sequelize.STRING,
    detail: Sequelize.STRING,
    config: Sequelize.STRING,
    options: Sequelize.STRING,
    calculation: Sequelize.STRING,
    surveyId: foreignKey('Survey'),
    dataElementId: foreignKey('ProgramDataElement'),
  },
});
