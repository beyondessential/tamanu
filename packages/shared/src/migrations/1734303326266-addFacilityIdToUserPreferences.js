import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('user_preferences', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('user_preferences', 'facility_id');
}
