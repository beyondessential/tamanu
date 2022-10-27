import { STRING, TEXT } from 'sequelize';

export async function up(query) {
  await query.changeColumn('imaging_requests', 'results', {
    type: TEXT,
    defaultValue: '',
  });
}

export async function down(query) {
  await query.changeColumn('imaging_requests', 'results', {
    type: STRING,
    defaultValue: '',
  });
}
