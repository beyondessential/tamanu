import { DataTypes } from 'sequelize';

const TABLE_NAME = 'program_data_elements';
const COLUMN_NAME = 'visualisation_config';

export async function up(query) {
  await query.addColumn(TABLE_NAME, COLUMN_NAME, {
    type: DataTypes.CHAR(255),
  });
}

export async function down(query) {
  await query.removeColumn(TABLE_NAME, COLUMN_NAME);
}
