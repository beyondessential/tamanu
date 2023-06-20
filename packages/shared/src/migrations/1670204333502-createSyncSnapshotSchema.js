const SCHEMA = 'sync_snapshots';

export async function up(query) {
  await query.createSchema(SCHEMA, {});
}

export async function down(query) {
  await query.dropSchema(SCHEMA);
}
