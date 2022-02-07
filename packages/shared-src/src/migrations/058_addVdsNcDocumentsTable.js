const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('vds_nc_documents', {
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
        allowNull: true,
      },
      signed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message_data: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      unique: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      algorithm: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      signature: {
        type: Sequelize.BLOB,
        allowNull: true,
      },
      facility_id: {
        type: Sequelize.STRING,
        references: {
          model: 'facilities',
          key: 'id',
        },
      },
      signer_id: {
        type: Sequelize.STRING,
        references: {
          model: 'vds_nc_signers',
          key: 'id',
        },
      },
    });
    await query.addIndex('vds_nc_documents', {
      fields: ['unique'],
      unique: true,
    });
  },
  down: async query => {
    await query.removeIndex('vds_nc_documents', {
      fields: ['unique'],
      unique: true,
    });
    await query.dropTable('vds_nc_documents');
  },
};
