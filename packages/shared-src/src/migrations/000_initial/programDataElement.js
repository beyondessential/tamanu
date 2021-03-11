module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    code: Sequelize.STRING,
    name: Sequelize.STRING,
    indicator: Sequelize.STRING,
    defaultText: Sequelize.STRING,
    defaultOptions: Sequelize.STRING,
    type: Sequelize.STRING,
  },
  options: {
    indexes: [
      { fields: ['code'], unique: true },
    ]
  }
});
