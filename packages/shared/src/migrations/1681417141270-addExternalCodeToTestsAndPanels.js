import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_test_panels', 'external_code', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.addColumn('lab_test_types', 'external_code', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('lab_test_panels', 'external_code');
  await query.removeColumn('lab_test_types', 'external_code');
}
