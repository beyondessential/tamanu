import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('location_groups', 'is_bookable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query) {
  await query.removeColumn('location_groups', 'is_bookable');
}
