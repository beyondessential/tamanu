const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patients', 'date_of_death', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await query.addIndex('patients', {
      fields: ['date_of_death'],
    });
  },
  down: async query => {
    await query.removeIndex('patients', ['date_of_death']);
    await query.removeColumn('patients', 'date_of_death');
  },
};
