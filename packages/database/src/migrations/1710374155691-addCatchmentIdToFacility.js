import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('facilities', 'catchment_id', {
    type: DataTypes.TEXT,
    references: {
      model: 'reference_data',
      key: 'id',
    },
    allowNull: true,
  });
  await query.addIndex('facilities', ['catchment_id']);
}

export async function down(query) {
  await query.removeColumn('facilities', 'catchment_id');
}
