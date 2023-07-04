module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    note: Sequelize.STRING,
    recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
    type: Sequelize.ENUM(['issue', 'warning']),
    patientId: foreignKey('Patient'),
  },
});
