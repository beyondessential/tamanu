import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('encounters', 'is_discharged', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}

export async function down(query) {
  await query.removeColumn('encounters', 'is_discharged');
}
