module.exports = {
  up: async query => {
    await query.renameTable('user_feature_flags_caches', 'user_localisation_caches');
    await query.renameColumn('user_localisation_caches', 'feature_flags', 'localisation');
  },
  down: async query => {
    await query.renameColumn('user_localisation_caches', 'localisation', 'feature_flags');
    await query.renameTable('user_localisation_caches', 'user_feature_flags_caches');
  },
};
