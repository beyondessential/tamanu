import { Command } from 'commander';
import { migrateDataInBatches } from './migrateDataInBatches/migrateDataInBatches';

export async function migrateNotePagesToNotes({ limit }) {
  return migrateDataInBatches('NotePagesToNotes', { batchSize: limit });
}

export const migrateNotePagesToNotesCommand = new Command('migrateNotePagesToNotes')
  .description(
    `[Deprecated] Migrates note pages to notes (use migrateDataInBatches instead, it's identical but has more options)`,
  )
  .option('-l, --limit <number>', 'Batching size for migrating note_pages to notes')
  .action(migrateNotePagesToNotes);
