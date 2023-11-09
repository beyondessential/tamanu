import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_requests', 'specimen_type_id', {
    type: DataTypes.STRING,
    references: {
      model: 'reference_data',
      key: 'id',
    },
    allowNull: true,
  });
  await query.addColumn('lab_requests', 'collected_by_id', {
    type: DataTypes.STRING,
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('lab_requests', 'specimen_type_id');
  await query.removeColumn('lab_requests', 'collected_by_id');
}
