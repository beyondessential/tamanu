import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('ips_requests', 'error', {
    type: DataTypes.TEXT,
  });
}

export async function down(query) {
  await query.removeColumn('ips_requests', 'error');
}
