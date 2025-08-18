import config from 'config';
import shortid from 'shortid';
import { FACT_DEVICE_ID } from '@tamanu/constants/facts';

/**
 * Initialize device ID for a server instance
 * @param {Object} context - The application context
 * @param {boolean} isCentralServer - Whether this is a central server (true) or facility server (false)
 * @returns {Promise<void>}
 */
export async function initDeviceId({ context, serverType = 'facility' }) {
  const { LocalSystemFact } = context.models;
  let deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
  if (!deviceId) {
    deviceId = config.deviceId ?? `${serverType}-${shortid()}`;
    await LocalSystemFact.set(FACT_DEVICE_ID, deviceId);
  } else if (config.deviceId && deviceId !== config.deviceId) {
    throw new Error(
      `Device ID mismatch: ${deviceId} (from database) vs ${config.deviceId} (from config)`,
    );
  }
  // eslint-disable-next-line require-atomic-updates
  context.deviceId = deviceId;
}
