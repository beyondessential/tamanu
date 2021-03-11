module.exports = ({ Sequelize }) => ({
  fields: {
    code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },

  options: {
    indexes: [
      {
        unique: false,
        fields: ['type'],
      },
      {
        unique: false,
        name: 'code_by_type',
        fields: ['code', 'type'],
      },
    ],
  },
});
