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
      unique_proof_id: {
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
      fields: ['unique_proof_id'],
      unique: true,
    });
  },
  down: async query => {
    await query.removeIndex('vds_nc_documents', ['unique_proof_id']);
    await query.dropTable('vds_nc_documents');
  },
};
