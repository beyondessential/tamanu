import { Command, Argument } from 'commander';
import { createNamedLogger } from '@tamanu/shared/services/logging/createNamedLogger';
import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';
import * as dataMigrations from './dataMigrations';
import { initDatabase } from '../../database';

export const migrateDataInBatches = async (
  name,
  { batchSize: batchSizeOverride, delay: delayOverrideMs, ...parameters },
) => {
  // setup
  const DataMigration = dataMigrations[name];
  if (!DataMigration) {
    throw new Error(`name not recognised: ${name}`);
  }
  const store = await initDatabase({ testMode: false });
  const batchSize = batchSizeOverride || DataMigration.defaultBatchSize;
  const delayMs = delayOverrideMs || DataMigration.defaultDelayMs;
  const log = createNamedLogger('migrateData', { name, batchSize, delay: delayMs });
  const dm = new DataMigration(store, log);

  // run
  log.info('Started data migration');
  let total = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const num = await dm.doBatch(batchSize, parameters);
    if (typeof num !== 'number') {
      throw new Error('doBatch must return a number');
    }
    total += num;
    log.info('Migrated data batch', { num, total });
    if (dm.isComplete()) {
      break;
    }
    if (delayMs > 0) {
      await sleepAsync(delayMs);
    }
  }

  // done
  log.info('Completed data migration', { total });
  process.exit(0);
};

const names = Object.keys(dataMigrations);
export const migrateDataInBatchesCommand = new Command('migrateDataInBatches')
  .description(
    'Runs data migrations too big to be ordinary migrations; includes features that are necessary for long-running tasks, like batching and delays',
  )
  .option('-b, --batchSize <number>', 'Batch size for migrating data')
  .option('-d, --delay <ms>', 'Delay in milliseconds between each batch')
  .addArgument(new Argument('<name>', 'Name of the data migration').choices(names))
  .action(migrateDataInBatches);
