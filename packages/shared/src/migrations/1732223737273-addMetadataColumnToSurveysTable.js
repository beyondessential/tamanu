import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('surveys', 'metadata', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('surveys', 'metadata');
}
