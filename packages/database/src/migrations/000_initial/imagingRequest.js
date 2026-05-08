module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    status: {
      type: Sequelize.ENUM(['pending', 'completed']),
      allowNull: false,
      defaultValue: 'pending',
    },

    requestedDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },

    encounterId: foreignKey('Encounter'),
    requestedById: foreignKey('User'),
    imagingTypeId: foreignKey('ReferenceData'),
  },
});
