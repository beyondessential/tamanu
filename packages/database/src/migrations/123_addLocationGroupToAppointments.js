import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('appointments', 'location_group_id', {
    type: Sequelize.STRING,
    allowNull: true,
    references: {
      model: 'location_groups',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('appointments', 'location_group_id');
}
