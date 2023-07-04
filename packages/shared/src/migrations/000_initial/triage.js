module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    arrivalTime: Sequelize.DATE,
    triageTime: Sequelize.DATE,
    closedTime: Sequelize.DATE,

    score: Sequelize.TEXT,
    encounterId: foreignKey('Encounter'),
    practitionerId: foreignKey('User'),
    chiefComplaintId: foreignKey('ReferenceData'),
    secondaryComplaintId: foreignKey('ReferenceData'),
  },
});
