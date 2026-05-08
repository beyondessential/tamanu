module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    note: Sequelize.STRING,
    recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
    relationship: Sequelize.STRING,
    patientId: foreignKey('Patient'),
    practitionerId: foreignKey('User'),
    diagnosisId: foreignKey('ReferenceData'),
  },
});
