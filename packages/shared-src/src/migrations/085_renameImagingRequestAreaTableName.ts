import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  query.renameTable('imaging_request_area', 'imaging_request_areas');
}

export async function down(query: QueryInterface) {
  query.renameTable('imaging_request_areas', 'imaging_request_area');
}
