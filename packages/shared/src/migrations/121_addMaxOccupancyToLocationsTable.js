import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('locations', 'max_occupancy', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('locations', 'max_occupancy');
}
