import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patients', 'foo', {
    type: DataTypes.DATE,
  });
}

export async function down(query) {
  await query.removeColumn('patients', 'foo');
}
