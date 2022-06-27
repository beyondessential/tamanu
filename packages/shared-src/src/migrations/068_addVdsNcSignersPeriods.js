const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.renameColumn('vds_nc_signers', 'not_before', 'validity_period_start');
    await query.renameColumn('vds_nc_signers', 'not_after', 'validity_period_end');

    await query.addColumn('vds_nc_signers', 'working_period_start', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await query.addColumn('vds_nc_signers', 'working_period_end', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await query.addIndex('vds_nc_signers', {
      fields: ['working_period_start'],
    });
    await query.addIndex('vds_nc_signers', {
      fields: ['working_period_end'],
    });

    await query.sequelize.query(`
      UPDATE vds_nc_signers
      SET
        working_period_start = validity_period_start,
        working_period_end = validity_period_end;
    `);
  },
  down: async query => {
    await query.removeIndex('vds_nc_signers', ['working_period_start']);
    await query.removeIndex('vds_nc_signers', ['working_period_end']);
    await query.removeColumn('vds_nc_signers', 'working_period_start');
    await query.removeColumn('vds_nc_signers', 'working_period_end');

    await query.renameColumn('vds_nc_signers', 'validity_period_end', 'not_after');
    await query.renameColumn('vds_nc_signers', 'validity_period_start', 'not_before');
  },
};
