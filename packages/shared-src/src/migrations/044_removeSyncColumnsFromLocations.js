const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.removeColumn('locations', 'marked_for_push');
    await query.removeColumn('locations', 'pushed_at');
    await query.removeColumn('locations', 'pulled_at');
  },
  down: async query => {
    await query.addColumn('locations', 'marked_for_push', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await query.addColumn('locations', 'pushed_at', Sequelize.DATE);
    await query.addColumn('locations', 'pulled_at', Sequelize.DATE);
  },
};
