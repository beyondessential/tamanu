const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // Adding a non-nullable column will fail if there are records in the db
    await query.addColumn('lab_requests', 'display_id', {
      type: sequelize.STRING,
      allowNull: false,
      defaultValue: 'NO_DISPLAY_ID',
    });

    // this monster of a query takes the first seven characters of a UUID
    // (guaranteed to match /[0-9a-f]{7}/), uppercases it, and replaces the
    // naughty characters 0 and 1 with G and H
    //
    // has substantially less randomness than a properly generated nanoid
    // but that's probably okay for existing Tamanu deployments as of 2021-06-25
    query.sequelize.query(`
UPDATE lab_requests
  SET display_id = replace(replace(substring(upper(id) FROM 1 for 7), '0', 'G'), '1', 'H')
  WHERE display_id = 'NO_DISPLAY_ID'
`);

    // Removing the default value
    await query.changeColumn('lab_requests', 'display_id', {
      type: sequelize.STRING,
      allowNull: false,
    });
  },
  down: async query => {
    await query.removeColumn('lab_requests', 'display_id');
  },
};
