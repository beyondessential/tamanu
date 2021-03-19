module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    settingName: { type: Sequelize.STRING, unique: true },
    settingContent: Sequelize.STRING,
  },
});
