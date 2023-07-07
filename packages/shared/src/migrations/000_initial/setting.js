module.exports = ({ Sequelize }) => ({
  fields: {
    settingName: { type: Sequelize.STRING, unique: true },
    settingContent: Sequelize.STRING,
  },
});
