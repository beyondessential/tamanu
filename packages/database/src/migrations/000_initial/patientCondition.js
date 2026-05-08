module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    note: Sequelize.STRING,
    recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
    resolved: { type: Sequelize.BOOLEAN, defaultValue: false },
    patientId: foreignKey('Patient'),
    examinerId: foreignKey('User'),
    conditionId: foreignKey('ReferenceData'),
  },
});
