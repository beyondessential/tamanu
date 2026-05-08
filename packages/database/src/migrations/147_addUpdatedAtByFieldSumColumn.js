import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_session_records', 'updated_at_by_field_sum', {
    type: DataTypes.BIGINT,
  });
}

export async function down(query) {
  await query.removeColumn('sync_session_records', 'updated_at_by_field_sum');
}
