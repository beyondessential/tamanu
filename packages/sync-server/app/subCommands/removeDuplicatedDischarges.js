import { Command } from 'commander';
import { migrateDataInBatches } from './migrateDataInBatches/migrateDataInBatches';

export async function removeDuplicatedDischarges({
  batchSize = Number.MAX_SAFE_INTEGER,
  sleepAsyncDuration = 50,
} = {}) {
  return migrateDataInBatches('RemoveDuplicatedDischarges', {
    batchSize,
    delayMs: sleepAsyncDuration,
  });
}

export const removeDuplicatedDischargesCommand = new Command('removeDuplicatedDischarges')
  .description('Remove duplicated discharges')
  .option('-b, --batchSize <number>', 'Batching size for number of encounters')
  .option(
    '-s, --sleepAsyncDuration <number>',
    'Sleep duration between batches in milliseconds (default 50ms)',
  )

  .action(removeDuplicatedDischarges);
