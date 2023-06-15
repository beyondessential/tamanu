module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
    patientId: foreignKey('Patient'),
    examinerId: foreignKey('User'),
    carePlanId: foreignKey('ReferenceData'),
  },
});
