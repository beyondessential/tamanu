import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_test_types', 'is_sensitive', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query) {
  await query.removeColumn('lab_test_types', 'is_sensitive');
}
