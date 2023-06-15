module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    referralNumber: Sequelize.STRING,
    reasonForReferral: Sequelize.STRING,
    cancelled: Sequelize.BOOLEAN,
    urgent: Sequelize.BOOLEAN,

    date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },

    encounterId: foreignKey('Encounter'),
    patientId: foreignKey('Patient'),
    referredById: foreignKey('User'),
    referredToDepartmentId: foreignKey('ReferenceData'),
    referredToFacilityId: foreignKey('ReferenceData'),
  },
});
