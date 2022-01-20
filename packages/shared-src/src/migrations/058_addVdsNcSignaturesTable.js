const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('vds_nc_signatures', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      date_requested: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      date_signed: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      recipient_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      document_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message_data: {
        type: Sequelize.JSON,
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
    await query.dropTable('vds_nc_signatures');
  },
};
