import { DataTypes } from 'sequelize';

export async function up(query) {
  return query.changeColumn('lab_request_logs', 'status', {
    type: DataTypes.STRING(31),
    allowNull: false,
  });
}

const LAB_REQUEST_STATUSES = [
  'reception_pending',
  'results_pending',
  'to_be_verified',
  'verified',
  'published',
  'deleted',
  'cancelled',
];

export async function down(query) {
  await query.sequelize.query('DROP TYPE "enum_lab_request_logs_status"');
  return query.changeColumn('lab_request_logs', 'status', {
    type: DataTypes.ENUM(LAB_REQUEST_STATUSES),
  });
}
