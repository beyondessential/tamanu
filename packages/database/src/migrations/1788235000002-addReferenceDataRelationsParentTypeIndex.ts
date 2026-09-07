import { QueryInterface } from 'sequelize';

const TABLE = 'reference_data_relations';
const FIELDS = ['reference_data_parent_id', 'type'];
const INDEX_NAME = 'reference_data_relations_parent_id_type_index';

// The only composite index on this table is the unique (reference_data_id, reference_data_parent_id,
// type), whose leading column is the child id. Looking up a parent's related children by
// (parent_id, type) — e.g. a lab test category's default specimen type on lab page loads — had no
// index and fell back to a scan of this (large) table.
export async function up(query: QueryInterface): Promise<void> {
  await query.addIndex(TABLE, FIELDS, { name: INDEX_NAME });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, INDEX_NAME);
}
