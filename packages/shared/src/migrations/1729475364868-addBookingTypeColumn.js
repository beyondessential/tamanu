import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('appointments', 'booking_type', {
    type: DataTypes.STRING,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('appointments', 'booking_type');
}
