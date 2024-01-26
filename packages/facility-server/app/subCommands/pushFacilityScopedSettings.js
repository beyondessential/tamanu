import { Command } from 'commander';
import config from 'config';

import { CentralServerConnection } from '../sync';
import { ApplicationContext } from '../ApplicationContext';
import { initDeviceId } from '../sync/initDeviceId';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';

async function pushFacilityScopedSettings() {
  const context = await new ApplicationContext().init();
  const { models } = context;
  await initDeviceId(context);
  // TODO: We need to add settings to ApplicationContext as its that way in central server but not facility
  const settings = new ReadSettings(models, config.serverFacilityId);
  const facilitySettings = await models.Setting.findAll({
    where: { facilityId: config.serverFacilityId, scope: SETTINGS_SCOPES.FACILITY },
  });
  console.log(facilitySettings);
  const centralServer = new CentralServerConnection({ ...context, settings });
  await centralServer.connect();

  // await centralServer.post('admin/settings', { settings: facilitySettings });
}

export const pushFacilityScopedSettingsCommand = new Command('pushFacilityScopedSettings')
  .description(
    'Push initial facility scoped settings to central server on upgrading from config-based settings',
  )
  .action(pushFacilityScopedSettings);
