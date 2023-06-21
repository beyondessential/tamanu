module.exports = ({ Sequelize, foreignKey }) => ({
  name: 'Patient',

  fields: {
    displayId: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },

    firstName: Sequelize.STRING,
    middleName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    culturalName: Sequelize.STRING,

    email: Sequelize.STRING,

    dateOfBirth: Sequelize.DATE,
    sex: {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: false,
    },
    bloodType: Sequelize.STRING,
    villageId: foreignKey('ReferenceData'),
    nationalityId: foreignKey('ReferenceData'),
    countryId: foreignKey('ReferenceData'),
    divisionId: foreignKey('ReferenceData'),
    subdivisionId: foreignKey('ReferenceData'),
    medicalAreaId: foreignKey('ReferenceData'),
    nursingZoneId: foreignKey('ReferenceData'),
    settlementId: foreignKey('ReferenceData'),
    occupationId: foreignKey('ReferenceData'),
  },

  options: {
    indexes: [
      {
        fields: ['display_id'],
      },
    ],
  },
});
