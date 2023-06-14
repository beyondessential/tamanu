module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    startTime: { type: Sequelize.DATE, allowNull: true },
    endTime: { type: Sequelize.DATE, allowNull: true },
    result: { type: Sequelize.FLOAT, allowNull: true },
    surveyId: foreignKey('Survey'),
    encounterId: foreignKey('Encounter'),
  },
});
