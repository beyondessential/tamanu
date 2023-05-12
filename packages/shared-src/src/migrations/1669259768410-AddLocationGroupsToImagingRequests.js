import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('imaging_requests', 'location_group_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'location_groups',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('imaging_requests', 'location_group_id');
}
