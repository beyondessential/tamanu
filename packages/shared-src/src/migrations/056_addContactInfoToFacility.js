const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    const nullableString = {
      type: Sequelize.STRING,
      allowNull: true,
    };
    await query.addColumn('facility', 'email', nullableString);
    await query.addColumn('facility', 'contact_number', nullableString);
    await query.addColumn('facility', 'city_town', nullableString);
    await query.addColumn('facility', 'street_address', nullableString);
  },
  down: async query => {
    await query.removeColumn('facility', 'email');
    await query.removeColumn('facility', 'contact_number');
    await query.removeColumn('facility', 'city_town');
    await query.removeColumn('facility', 'street_address');
  },
};
