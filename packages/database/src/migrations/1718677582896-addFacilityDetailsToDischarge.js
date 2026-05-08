import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('discharges', 'facility_name', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await query.addColumn('discharges', 'facility_address', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await query.addColumn('discharges', 'facility_town', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('discharges', 'facility_name');
  await query.removeColumn('discharges', 'facility_address');
  await query.removeColumn('discharges', 'facility_town');
}
