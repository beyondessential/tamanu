import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_requests', 'department_id', {
    type: DataTypes.STRING,
    references: {
      model: 'departments',
      key: 'id',
    },
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('lab_requests', 'department_id');
}
