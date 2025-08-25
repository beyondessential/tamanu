import { Sequelize } from 'sequelize';
import {
  DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR,
  DEVICE_SCOPES,
  SETTING_KEYS,
} from '@tamanu/constants';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { difference } from 'lodash';

/**
 * @param {{ models: import("@tamanu/database").Models; settings: import("@tamanu/settings").ReadSettings; user: import("@tamanu/database").User, deviceId?: string; tamanuClient: import("@tamanu/constants").ServerType; scopes: import("@tamanu/constants").DeviceScope[]; }}
 */
export async function ensureDeviceRegistration({
  models: { Device },
  settings,
  user,
  deviceId,
  scopes,
}) {
  const deviceRegistrationQuotaEnabled = await settings.get(
    SETTING_KEYS.FEATURES_DEVICE_REGISTRATION_QUOTA_ENABLED,
  );
  if (!deviceRegistrationQuotaEnabled) {
    return;
  }

  // There's two race conditions we seek to avoid with this transaction:
  //
  // 1. If the device logs in to the server twice simultaneously, we want
  //    to avoid two SyncDevice records being created. This is also mitigated
  //    by the UNIQUE constraint on the table.
  //
  // 2. If two unknown devices try to register at the same time, and the
  //    quota is reached on the first one, the second should not be able to.
  await Device.sequelize.transaction(
    {
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    },
    async () => {
      if (!deviceId) {
        if (scopes.includes(DEVICE_SCOPES.SYNC_CLIENT)) {
          throw new BadAuthenticationError('Device ID is required');
        } else {
          return;
        }
      }

      const syncDevice = await Device.findByPk(deviceId);
      if (syncDevice) {
        if (difference(scopes, syncDevice.scopes).length > 0) {
          throw new BadAuthenticationError('Requested more scopes than the device has');
        }

        await syncDevice.markSeen();
        return;
      }

      const device = new Device({
        id: deviceId,
        registeredById: user.id,
        scopes,
      });

      if (device.requiresQuota()) {
        const currentCount = await Device.getQuotaByUserId(user.id);
        if (currentCount + 1 > user.deviceRegistrationQuota) {
          throw new BadAuthenticationError(DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR);
        }
      }

      await device.save();
    },
  );
}
