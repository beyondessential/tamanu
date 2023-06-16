import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_requests', 'lab_sample_site_id', {
    type: DataTypes.STRING,
    references: {
      model: 'reference_data',
      key: 'id',
    },
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('lab_requests', 'lab_sample_site_id');
}
