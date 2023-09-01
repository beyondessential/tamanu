import { Command } from 'commander';

import { initDatabase } from '../database';
import { initDeviceId } from '../sync/initDeviceId';
import { FacilitySyncManager, CentralServerConnection } from '../sync';

async function sync() {
  const context = await initDatabase();

  await initDeviceId(context);

  context.centralServer = new CentralServerConnection(context);
  context.centralServer.connect(); // preemptively connect central server to speed up sync
  context.syncManager = new FacilitySyncManager(context);

  await context.syncManager.triggerSync('subcommand');
}

export const syncCommand = new Command('sync').description('Sync with central server').action(sync);
