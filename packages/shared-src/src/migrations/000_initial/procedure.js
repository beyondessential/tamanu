module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    completed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    date: { type: Sequelize.DATE, allowNull: false },
    endTime: { type: Sequelize.DATE, allowNull: true },
    note: Sequelize.STRING,
    completedNote: Sequelize.STRING,
    encounterId: foreignKey('Encounter'),
    locationId: foreignKey('ReferenceData'),
    procedureTypeId: foreignKey('ReferenceData'),
    anaestheticId: foreignKey('ReferenceData'),
    physicianId: foreignKey('User'),
    assistantId: foreignKey('User'),
    anaesthetistId: foreignKey('User'),
  },
});
