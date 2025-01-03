import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('procedures', 'start_time', {
    type: STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('procedures', 'start_time');
}
