import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_test_panels', 'category_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('lab_test_panels', 'category_id');
}
