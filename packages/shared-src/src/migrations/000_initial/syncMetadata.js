module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    channel: { type: Sequelize.STRING, allowNull: false, },
    lastSynced: { type: Sequelize.BIGINT, defaultValue: 0, }
  },
});
