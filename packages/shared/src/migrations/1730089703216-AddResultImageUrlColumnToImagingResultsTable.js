/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('imaging_results', 'result_image_url', {
    type: DataTypes.TEXT,
    defaultValue: null,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('imaging_results', 'result_image_url');
}
