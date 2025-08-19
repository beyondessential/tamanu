import { Sequelize } from 'sequelize';
import { DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR, SETTING_KEYS } from '@tamanu/constants';
import { BadAuthenticationError } from '@tamanu/shared/errors';

export async function ensureDeviceRegistration({ Device }, settings, user, deviceId) {
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
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    },
    async () => {
      const syncDevice = await Device.findOne({
        where: {
          id: deviceId,
        },
      });

      if (syncDevice) {
        await syncDevice.markSeen();
        return;
      }

      const currentCount = await Device.getCountByUserId(user.id);
      if (currentCount + 1 > user.deviceRegistrationQuota) {
        throw new BadAuthenticationError(DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR);
      }

      await Device.create({
        id: deviceId,
        registeredById: user.id,
      });
    },
  );
}
