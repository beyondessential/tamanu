import { Sequelize } from 'sequelize';
import { DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR, SETTING_KEYS } from '@tamanu/constants';
import { BadAuthenticationError } from '@tamanu/shared/errors';

export async function ensureDeviceRegistration(models, settings, user, deviceId) {
  const deviceRegistrationQuotaEnabled = await settings.get(
    SETTING_KEYS.FEATURES_DEVICE_REGISTRATION_QUOTA_ENABLED,
  );

  if (!deviceRegistrationQuotaEnabled) {
    return;
  }

  const syncDevice = await models.SyncDevice.findOne({
    where: {
      deviceId,
    },
  });

  if (syncDevice) {
    await syncDevice.markSeen();
    return;
  }

  // Avoid race conditions by using a transaction
  await models.SyncDevice.sequelize.transaction(
    {
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    },
    async () => {
      // If 2 unknown devices try to register at the same time,
      // and the quota is reached on the first one,
      // the second one should not be able to register.

      // Number of devices already registered by this user
      const currentCount = await models.SyncDevice.getCountByUserId(user.id);
      if (currentCount + 1 > user.deviceRegistrationQuota) {
        throw new BadAuthenticationError(DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR);
      }

      await models.SyncDevice.create({
        deviceId,
        registeredById: user.id,
      });
    },
  );
}
