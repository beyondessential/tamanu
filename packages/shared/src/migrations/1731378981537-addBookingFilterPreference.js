import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('user_preferences', 'location_booking_filters', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('user_preferences', 'location_booking_filters');
}
