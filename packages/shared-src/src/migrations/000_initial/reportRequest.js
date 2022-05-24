module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    reportType: { type: Sequelize.STRING, allowNull: false },
    recipients: { type: Sequelize.TEXT, allowNull: false },
    parameters: Sequelize.TEXT,
    status: {
      type: Sequelize.ENUM(['Received', 'Processed']),
      defaultValue: 'Processed',
      allowNull: false,
    },
    requestedByUserId: {
      ...foreignKey('User'),
      allowNull: false,
      onDelete: 'cascade',
    },
  },
});
