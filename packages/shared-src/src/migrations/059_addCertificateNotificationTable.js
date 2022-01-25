const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('certificate_notifications', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      type: {
        // Use the same types as the document table
        // icao.vacc, icao.test
        type: 'enum_vds_nc_documents_type',
        allowNull: false,
      },
      require_signing: {
        type: Sequelize.BOOLEAN,
        defaultValue: null,
      },
      patient_id: {
        type: Sequelize.STRING,
        references: { model: 'patients', key: 'id' },
      },
      forward_address: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
    });
  },
  down: async query => {
    await query.dropTable('certificate_notifications');
  },
};
