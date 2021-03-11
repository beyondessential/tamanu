module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    code: Sequelize.STRING,
    name: Sequelize.STRING,
  },
  options: {
    indexes: [
      { fields: ['code'], unique: true },
    ]
  }
});
