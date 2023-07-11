import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('encounters', 'planned_location_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'locations',
      key: 'id',
    },
  });

  await query.addColumn('encounters', 'planned_location_start_time', {
    type: 'date_time_string',
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('encounters', 'planned_location_id');
  await query.removeColumn('encounters', 'planned_location_start_time');
}
