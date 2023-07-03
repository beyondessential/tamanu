import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';

import { initDatabase } from '../database';

export async function migrateNotePagesToNotes({ limit = Number.MAX_SAFE_INTEGER }) {
  log.info('Migrating note pages to notes...');

  const store = await initDatabase({ testMode: false });
  const { Note } = store.models;

  try {
    let fromId = '00000000-0000-0000-0000-000000000000';
    let total = 0;

    while (fromId != null) {
      const [[{ maxId, count }]] = await Note.sequelize.query(
        `
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
            WHERE note_items.id > :fromId
            AND note_items.id NOT IN (SELECT id FROM notes)
            ORDER BY note_items.id
            LIMIT :limit
            RETURNING id
        )
        SELECT 
          MAX(id::text) AS "maxId",
          COUNT(id) AS "count"
        FROM inserted;
    `,
        {
          replacements: {
            fromId,
            limit,
          },
        },
      );

      sleepAsync(50);

      fromId = maxId;
      const chunkCount = parseInt(count, 10) + 0;
      total += chunkCount;
      // console.log('chunkCount', chunkCount);

      log.info(`Migrated batch with ${chunkCount} notes...`);
    }

    log.info(`Successfully migrated ${total} notes...`);

    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const migrateNotePagesToNotesCommand = new Command('migrateNotePagesToNotes')
  .description('Migrates note pages to notes')
  .option('-l, --limit <number>', 'Batching size for migrating notes')
  .action(migrateNotePagesToNotes);
