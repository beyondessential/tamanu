import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.removeColumn('lab_request_logs', 'marked_for_sync');
}

export async function down(query) {
  await query.addColumn('lab_request_logs', 'marked_for_sync', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}
