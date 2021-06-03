const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    query.renameTable('user_feature_flags_caches', 'user_localisation_caches');
    query.renameColumn('user_localisation_caches', 'feature_flags', 'localisation');
  },
  down: async query => {
    query.renameColumn('user_localisation_caches', 'localisation', 'feature_flags');
    query.renameTable('user_localisation_caches', 'user_feature_flags_caches');
  },
};
