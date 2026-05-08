module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    certainty: Sequelize.ENUM(['suspected', 'confirmed', 'made_in_error']),
    isPrimary: Sequelize.BOOLEAN,
    date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    encounterId: foreignKey('Encounter'),
    diagnosisId: foreignKey('ReferenceData'),
  },
});
