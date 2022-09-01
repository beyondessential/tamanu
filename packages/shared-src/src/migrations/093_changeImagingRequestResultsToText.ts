import { QueryInterface, STRING, TEXT } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.changeColumn('imaging_requests', 'results', {
    type: TEXT,
    defaultValue: '',
  });
}

export async function down(query: QueryInterface) {
  await query.changeColumn('imaging_requests', 'results', {
    type: STRING,
    defaultValue: '',
  });
}
