module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    recordId: { type: Sequelize.STRING, allowNull: false },
    recordType: {
      type: Sequelize.ENUM(['Encounter', 'Patient', 'Triage', 'PatientCarePlan']),
      allowNull: false,
    },

    date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    noteType: {
      type: Sequelize.ENUM(['system', 'other', 'treatmentPlan']),
      default: 'system',
      allowNull: false,
    },
    content: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },

    authorId: foreignKey('User'),
    onBehalfOfId: foreignKey('User'),
  },
});
