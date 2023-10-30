import { ReadSettings } from '@tamanu/settings';
import { Command } from 'commander';
import config from 'config';
import { initDatabase } from '../database';
import { initDeviceId } from '../sync/initDeviceId';
import { FacilitySyncManager, CentralServerConnection } from '../sync';

async function sync() {
  const context = await initDatabase();
  await initDeviceId(context);
  const settings = new ReadSettings(context.models, config.serverFacilityId);
  const syncConfig = await settings.get('sync');
  context.centralServer = new CentralServerConnection({ ...context, settings }, syncConfig);
  context.centralServer.connect(); // preemptively connect central server to speed up sync
  context.syncManager = new FacilitySyncManager(context);

  await context.syncManager.triggerSync('subcommand');
}

export const syncCommand = new Command('sync').description('Sync with central server').action(sync);
