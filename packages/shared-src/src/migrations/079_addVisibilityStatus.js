import Sequelize, { QueryInterface } from 'sequelize';

const tables = [
  'departments',
  'facilities',
  'locations',
  'reference_data',
  'lab_test_types',
  'scheduled_vaccines',
];

export async function up(query) {
  for (let table of tables) {
    await query.addColumn(
      table,
      'visibility_status', 
      {
        type: Sequelize.TEXT,
        defaultValue: 'current',
      },
    );
  }
}

export async function down(query) {
  for (let table of tables) {
    await query.removeColumn(table, 'visibility_status');
  }
}
