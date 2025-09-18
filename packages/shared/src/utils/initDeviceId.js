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
  let deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
  if (!deviceId) {
    deviceId = config.deviceId ?? `${deviceType}-${shortid()}`;
    await LocalSystemFact.setIfAbsent(FACT_DEVICE_ID, deviceId);
  } else if (config.deviceId && deviceId !== config.deviceId) {
    throw new Error(
      `Device ID mismatch: ${deviceId} (from database) vs ${config.deviceId} (from config)`,
    );
  }
  // eslint-disable-next-line require-atomic-updates
  context.deviceId = deviceId;
}
