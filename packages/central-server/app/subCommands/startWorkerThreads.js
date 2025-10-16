import { Command } from 'commander';
import { log } from '@tamanu/shared/services/logging';
import { WorkerThreadManager } from '../WorkerThreadManager';
import pkg from '../../package.json';

export const startWorkerThreads = async () => {
  log.info(`Starting Tamanu Central with worker threads version ${pkg.version}`);
  const manager = new WorkerThreadManager();

  try {
    await manager.start();
    await manager.waitForWorkers();
  } catch (error) {
    log.error('Worker thread manager failed:', error);
    process.exit(1);
  }
};

export const startWorkerThreadsCommand = new Command('startWorkerThreads')
  .alias('startWorkers')
  .description('Start Tamanu Central using worker threads instead of PM2')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startWorkerThreads);
