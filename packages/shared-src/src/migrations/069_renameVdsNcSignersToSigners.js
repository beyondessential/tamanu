module.exports = {
  up: async query => {
    await query.renameTable('vds_nc_signers', 'signers');
  },
  down: async query => {
    await query.renameTable('signers', 'vds_nc_signers');
  },
};
