const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // Adding a non-nullable column will fail if there are records in the db

    // Could delete all current lab requests:
    // await query.bulkDelete('lab_requests', {}); 
    await query.addColumn('lab_requests', 'display_id', {
      type: sequelize.STRING,
      allowNull: false,
      // Or could add a default value while adding the column, then remove it later.
      // defaultValue: 'NO_DISPLAY_ID',
    });

    // Removing the default value
    // await query.changeColumn('lab_requests', 'display_id', {
    //   type: sequelize.STRING,
    //   allowNull: false,
    // });
  },
  down: async query => {
    await query.removeColumn('lab_requests', 'display_id');
  },
};
