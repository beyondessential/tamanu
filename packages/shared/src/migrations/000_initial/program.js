module.exports = ({ Sequelize }) => ({
  fields: {
    code: Sequelize.STRING,
    name: Sequelize.STRING,
  },
  options: {
    indexes: [{ fields: ['code'], unique: true }],
  },
});
