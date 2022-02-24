const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('vds_nc_signers', 'request_sent_at', {
      type: Sequelize.DATE,
      defaultValue: null,
    });
    await query.addIndex('vds_nc_signers', {
      fields: ['request_sent_at'],
    });
    await query.addIndex('vds_nc_signers', {
      fields: ['deleted_at'],
    });
  },
  down: async query => {
    await query.removeIndex('vds_nc_signers', ['deleted_at']);
    await query.removeIndex('vds_nc_signers', ['request_sent_at']);
    await query.removeColumn('vds_nc_signers', 'request_sent_at');
  },
};
