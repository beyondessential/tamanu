module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    note: Sequelize.STRING,
    recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
    patientId: foreignKey('Patient'),
    practitionerId: foreignKey('User'),
    allergyId: foreignKey('ReferenceData'),
  },
});
