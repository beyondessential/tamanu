import { Command } from 'commander';

import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { log } from '@tamanu/shared/services/logging';
import { initDeviceId } from '@tamanu/shared/utils';
import { DEVICE_TYPES } from '@tamanu/constants';
import { CentralServerConnection, FacilitySyncManager } from '../sync';
import { ApplicationContext } from '../ApplicationContext';

async function sync({ delay: delaySecondsStr }) {
  const delaySeconds = parseInt(delaySecondsStr, 10);
  if (!Number.isFinite(delaySeconds) || delaySeconds < 0) {
    throw new Error('invalid option for delay');
  }
  const context = await new ApplicationContext().init({ appType: 'cmd:sync' });

  await initDeviceId({ context, deviceType: DEVICE_TYPES.FACILITY_SERVER });

  context.centralServer = new CentralServerConnection(context);
  context.centralServer.connect(); // preemptively connect central server to speed up sync
  context.syncManager = new FacilitySyncManager(context);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    log.info('Sync subcommand: beginning sync');
    const { ran, enabled, queued } = await context.syncManager.triggerSync({
      type: 'subcommand',
      urgent: true,
    });
    if (!enabled) {
      throw new Error('sync is not enabled, check config');
    }
    if (ran) {
      log.info('Sync subcommand: ran successfully');
      break;
    }
    if (queued) {
      log.info('Sync subcommand: sync queued, retrying', { delaySeconds });
      await sleepAsync(delaySeconds * 1000);
      continue;
    }
    // sync is enabled, did not run, and was not queued - error!
    throw new Error('sync is in an unknown state');
  }
}

export const syncCommand = new Command('sync')
  .description('Sync with central server')
  .option('-d, --delay <delay>', 'Delay in seconds between retries if queued', '15')
  .action(sync);
