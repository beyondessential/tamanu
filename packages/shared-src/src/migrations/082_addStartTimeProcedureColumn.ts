import { STRING, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('procedures', 'start_time', {
    type: STRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('procedures', 'start_time');
}
