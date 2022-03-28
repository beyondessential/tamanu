const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.changeColumn('vds_nc_signers', 'deleted_at', {
      type: Sequelize.DATE,
      defaultValue: null,
      allowNull: true,
    });
  },
  down: async query => {
    await query.changeColumn('vds_nc_signers', 'deleted_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    });
  },
};
