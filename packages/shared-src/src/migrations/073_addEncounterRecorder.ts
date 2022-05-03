import { STRING, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('encounters', 'recorder_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
  await query.sequelize.query('UPDATE encounters SET recorder_id = examiner_id');
}

export async function down(query: QueryInterface) {
  await query.removeColumn('encounters', 'recorder_id');
}
