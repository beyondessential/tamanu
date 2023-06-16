module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    code: Sequelize.STRING,
    name: Sequelize.STRING,
    programId: foreignKey('Program'),
  },
  options: {
    indexes: [{ fields: ['code'], unique: true }],
  },
});
