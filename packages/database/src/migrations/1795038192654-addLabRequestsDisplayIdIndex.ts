import { QueryInterface } from 'sequelize';

const TABLE = 'lab_requests';
const FIELDS = ['display_id'];
const INDEX_NAME = 'lab_requests_display_id';

export async function up(query: QueryInterface): Promise<void> {
  await query.addIndex(TABLE, FIELDS, { name: INDEX_NAME });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, INDEX_NAME);
}
