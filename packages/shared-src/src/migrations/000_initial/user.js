module.exports = ({ Sequelize }) => ({
  name: 'User',

  fields: {
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: Sequelize.STRING,
    displayName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.STRING,
      defaultValue: 'practitioner',
      allowNull: false,
    },
  },

  options: {
    indexes: [
      {
        fields: ['email'],
      },
    ],
  },
});
