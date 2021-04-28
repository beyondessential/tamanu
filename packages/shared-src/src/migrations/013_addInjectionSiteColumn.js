const Sequelize = require('sequelize');

const INJECTION_SITE_OPTIONS = [
  'Left arm',
  'Right arm',
  'Left thigh',
  'Right thigh',
  'Oral',
  'Other',
];

module.exports = {
  up: async query => {
    // missing columns to add
    await query.addColumn('administered_vaccines', 'injection_site', {
      type: Sequelize.STRING,
    });

  },
  down: async query => {
    await query.removeColumn('administered_vaccines', 'injection_site');
  },
};
