module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    batch: Sequelize.STRING,
    status: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    reason: Sequelize.STRING,
    location: Sequelize.STRING,
    date: {
      type: Sequelize.DATE,
      allowNull: false,
    },

    scheduledVaccineId: foreignKey('ScheduledVaccine'),
    encounterId: foreignKey('Encounter'),
  },
});
