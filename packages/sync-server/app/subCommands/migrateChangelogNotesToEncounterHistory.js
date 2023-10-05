import { Command } from 'commander';
import { migrateDataInBatches } from './migrateDataInBatches/migrateDataInBatches';

export async function migrateChangelogNotesToEncounterHistory({ batchSize }) {
  return migrateDataInBatches('ChangelogNotesToEncounterHistory', { batchSize });
}

export const migrateChangelogNotesToEncounterHistoryCommand = new Command(
  'migrateChangelogNotesToEncounterHistory',
)
  .description(
    `[Deprecated] Migrates changelog notes to encounter history (use migrateDataInBatches instead, it's identical but has more options)`,
  )
  .option('-b, --batchSize <number>', 'Batching size for migrating changelog notes')
  .action(migrateChangelogNotesToEncounterHistory);
