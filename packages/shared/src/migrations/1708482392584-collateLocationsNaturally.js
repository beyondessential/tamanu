/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes } from 'sequelize';

export async function up(query) {
  // Create a lang=en collation that sorts numbers naturally
  await query.sequelize.query(`
    CREATE COLLATION en_numeric (provider = icu, locale = 'en@colNumeric=yes');
  `);

  // Apply natural sorting order to locations and areas
  await query.changeColumn('locations', 'name', {
    type: DataTypes.STRING,
    collate: 'en_numeric',
  });
  await query.changeColumn('location_groups', 'name', {
    type: DataTypes.STRING,
    collate: 'en_numeric',
  });
}

export async function down(query) {
  await query.changeColumn('locations', 'name', {
    type: DataTypes.STRING,
    collate: null,
  });
  await query.changeColumn('location_groups', 'name', {
    type: DataTypes.STRING,
    collate: null,
  });

  await query.sequelize.query('DROP COLLATION en_numeric;');
}
