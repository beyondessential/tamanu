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

    dateOfBirth: Sequelize.DATE,
    sex: {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: false,
    },
    bloodType: Sequelize.STRING,
    villageId: foreignKey('ReferenceData'),
  },

  options: {
    indexes: [
      {
        fields: ['display_id'],
      },
    ],
  },
});
