import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('locations', 'parent_location_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'locations',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('locations', 'parent_location_id');
}
