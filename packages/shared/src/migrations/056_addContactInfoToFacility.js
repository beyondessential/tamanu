const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    const nullableString = {
      type: Sequelize.STRING,
      allowNull: true,
    };
    await query.addColumn('facilities', 'email', nullableString);
    await query.addColumn('facilities', 'contact_number', nullableString);
    await query.addColumn('facilities', 'city_town', nullableString);
    await query.addColumn('facilities', 'street_address', nullableString);
  },
  down: async query => {
    await query.removeColumn('facilities', 'email');
    await query.removeColumn('facilities', 'contact_number');
    await query.removeColumn('facilities', 'city_town');
    await query.removeColumn('facilities', 'street_address');
  },
};
