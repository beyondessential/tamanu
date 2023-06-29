const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('vds_nc_signers', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      country_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      private_key: {
        type: Sequelize.BLOB,
        allowNull: true,
      },
      public_key: {
        type: Sequelize.BLOB,
        allowNull: false,
      },
      request: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      certificate: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      not_before: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      not_after: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      signatures_issued: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });
    await query.addIndex('vds_nc_signers', {
      fields: ['not_before'],
    });
    await query.addIndex('vds_nc_signers', {
      fields: ['not_after'],
    });
  },
  down: async query => {
    await query.removeIndex('vds_nc_signers', ['not_after']);
    await query.removeIndex('vds_nc_signers', ['not_before']);
    await query.dropTable('vds_nc_signers');
  },
};
