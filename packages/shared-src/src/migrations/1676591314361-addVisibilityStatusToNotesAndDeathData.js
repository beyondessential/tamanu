import { DataTypes } from 'sequelize';

const tables = ['patient_death_data', 'note_pages'];

export async function up(query) {
  for (const table of tables) {
    await query.addColumn(table, 'visibility_status', {
      type: DataTypes.TEXT,
      defaultValue: 'current',
    });
  }
}

export async function down(query) {
  for (const table of tables) {
    await query.removeColumn(table, 'visibility_status');
  }
}
