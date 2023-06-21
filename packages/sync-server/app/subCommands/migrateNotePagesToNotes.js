import { Command } from 'commander';
import { log } from 'shared/services/logging';
import { initDatabase } from '../database';

export async function migrateNotePagesToNotes() {
  log.info('Migrating note pages to notes...');

  const store = await initDatabase({ testMode: false });
  const { Note } = store.models;

  try {
    const [[{ count: migrated }]] = await Note.sequelize.query(`
        WITH inserted AS (
            INSERT INTO notes (
                id,
                created_at,
                updated_at,
                deleted_at,
                note_type,
                record_id,
                record_type,
                date,
                date_legacy,
                visibility_status,
                author_id,
                on_behalf_of_id,
                revised_by_id,
                content
            )
            SELECT 
                note_items.id,
                note_items.created_at,
                note_items.updated_at,
                note_items.deleted_at,
                note_pages.note_type,
                note_pages.record_id,
                note_pages.record_type,
                note_items.date,
                note_items.date_legacy,
                note_pages.visibility_status,
                note_items.author_id,
                note_items.on_behalf_of_id,
                note_items.revised_by_id,
                note_items.content
            FROM note_items JOIN note_pages on note_items.note_page_id = note_pages.id
            RETURNING id
        )
        SELECT COUNT(*) as "count" 
        FROM inserted;
    `);

    log.info(`Sucessfully migrated ${migrated} records`);
    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const migrateNotePagesToNotesCommand = new Command('migrateNotePagesToNotes')
  .description('Migrates note pages to notes')
  .action(migrateNotePagesToNotes);
