import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('scheduled_vaccines', 'sort_index', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(query) {
  await query.removeColumn('scheduled_vaccines', 'sort_index');
}
