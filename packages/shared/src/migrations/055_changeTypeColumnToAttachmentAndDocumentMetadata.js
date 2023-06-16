const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.changeColumn('attachments', 'type', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await query.changeColumn('document_metadata', 'type', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
  down: async query => {
    await query.changeColumn('attachments', 'type', {
      type: Sequelize.STRING(31),
      allowNull: false,
    });
    await query.changeColumn('document_metadata', 'type', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
