import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('users', 'phone_number', {
    type: DataTypes.STRING,
  });
}

export async function down(query) {
  await query.removeColumn('users', 'phone_number');
}
