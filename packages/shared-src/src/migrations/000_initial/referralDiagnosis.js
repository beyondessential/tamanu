module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    certainty: {
      type: Sequelize.ENUM(['suspected', 'confirmed', 'made_in_error']),
      defaultValue: 'suspected',
    },

    referralId: foreignKey('Referral'),
    diagnosisId: foreignKey('ReferenceData'),
  },
});
