import { Command } from 'commander';
import { log } from 'shared/services/logging';
import { initDatabase } from '../database';

export async function dropLegacyNotesTable() {
  log.info('Delete legacy note_pages and note_items table...');

  const store = await initDatabase({ testMode: false });
  const { Note } = store.models;

  try {
    await Note.sequelize.query(`
      DROP TABLE note_items;
      DROP TABLE note_pages;
    `);

    log.info(`Sucessfully dropped note_pages and note_items table`);
    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const dropLegacyNotesTableCommand = new Command('dropLegacyNotesTable')
  .description('Drop legacy note_pages and note_items table')
  .action(dropLegacyNotesTable);
