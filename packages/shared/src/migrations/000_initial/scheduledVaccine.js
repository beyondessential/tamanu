module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    category: Sequelize.STRING,
    label: Sequelize.STRING,
    schedule: Sequelize.STRING,
    weeksFromBirthDue: Sequelize.INTEGER,
    index: Sequelize.INTEGER,

    vaccineId: foreignKey('ReferenceData'),
  },
});
