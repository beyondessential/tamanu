import config from 'config';
import shortid from 'shortid';
import { FACT_DEVICE_ID } from '@tamanu/constants/facts';

/**
 * @param {Object} context
 * @param {'central' | 'facility'} deviceType
 * @returns {Promise<void>}
 */
export async function initDeviceId({ context, deviceType }) {
  if (!deviceType) {
    throw new Error('Device type is required to initialize device ID');
  }

  const { LocalSystemFact } = context.store?.models || context.models;
  const declaredDeviceId = process.env.TAMANU_DEVICE_ID || config.deviceId;
  let deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
  if (!deviceId) {
    deviceId = declaredDeviceId || `${deviceType}-${shortid()}`;
    await LocalSystemFact.setIfAbsent(FACT_DEVICE_ID, deviceId);
  } else if (declaredDeviceId && deviceId !== declaredDeviceId) {
    throw new Error(
      `Device ID mismatch: ${deviceId} (from database) vs ${declaredDeviceId} (from TAMANU_DEVICE_ID or config)`,
    );
  }
  // eslint-disable-next-line require-atomic-updates
  context.deviceId = deviceId;
}
