import { type QueryInterface } from 'sequelize';

const HANDOVER_INDEX_NAME = 'idx_notes_handover';
const REVISED_BY_INDEX_NAME = 'idx_notes_revised_by';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS ${HANDOVER_INDEX_NAME}
    ON notes (record_type, note_type_id, revised_by_id);
  `);
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS ${REVISED_BY_INDEX_NAME}
    ON notes (revised_by_id);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX IF EXISTS ${REVISED_BY_INDEX_NAME};`);
  await query.sequelize.query(`DROP INDEX IF EXISTS ${HANDOVER_INDEX_NAME};`);
}
