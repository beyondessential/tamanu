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
        type: Sequelize.ENUM(['icao.vacc', 'icao.test']),
        allowNull: false,
      },
      message_data: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      algorithm: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      signature: {
        type: Sequelize.BLOB,
        allowNull: true,
      },
      patient_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patients',
          key: 'id',
        },
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
  },
  down: async query => {
    await query.dropTable('vds_nc_documents');
  },
};
