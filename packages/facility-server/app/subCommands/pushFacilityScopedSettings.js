import config from 'config';
import { Command } from 'commander';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';
import { log } from '@tamanu/shared/services/logging';

import { CentralServerConnection } from '../sync';
import { ApplicationContext } from '../ApplicationContext';
import { initDeviceId } from '../sync/initDeviceId';

/**
 * Push initial facility scoped settings to central server on upgrading from pre db-defined settings version
 * This is a one-off command that should be run as part of the manual release steps of the upgrade
 */
export async function pushFacilityScopedSettings() {
  const context = await new ApplicationContext().init();
  const { serverFacilityId } = config;
  const { models } = context;
  await initDeviceId(context);
  const settings = new ReadSettings(models, serverFacilityId);

  const facilityScopedSettings = await models.Setting.get(
    '',
    config.serverFacilityId,
    SETTINGS_SCOPES.FACILITY,
  );

  const centralServer = new CentralServerConnection({ ...context, settings });
  await centralServer.connect();

  try {
    await centralServer.forwardRequest(
      {
        method: 'PUT',
        body: {
          settings: facilityScopedSettings,
          facilityId: serverFacilityId,
          scope: SETTINGS_SCOPES.FACILITY,
        },
      },
      '/admin/settings',
    );

    log.info('Successfully pushed facility scoped settings to central server');
    process.exit(0);
  } catch (err) {
    process.stderr.write(
      `Failed to push facility scoped settings to central server: ${err.stack}\n`,
    );
    process.exit(1);
  }
}

export const pushFacilityScopedSettingsCommand = new Command('pushFacilityScopedSettings')
  .description('Push facility scoped settings to central server')
  .action(pushFacilityScopedSettings);
