module.exports = ({ Sequelize }) => ({
  fields: {
    channel: { type: Sequelize.STRING, allowNull: false },
    lastSynced: { type: Sequelize.BIGINT, defaultValue: 0 },
  },
});
