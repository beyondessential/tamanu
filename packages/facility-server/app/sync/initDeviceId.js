import config from 'config';
import shortid from 'shortid';
import { FACT_DEVICE_ID } from '@tamanu/constants/facts';

export async function initDeviceId(context) {
  const { LocalSystemFact } = context.models;
  let deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
  if (!deviceId) {
    deviceId = config.deviceId ?? `facility-${shortid()}`;
    await LocalSystemFact.set(FACT_DEVICE_ID, deviceId);
  } else if (config.deviceId && deviceId !== config.deviceId) {
    throw new Error(
      `Device ID mismatch: ${deviceId} (from database) vs ${config.deviceId} (from config)`,
    );
  }
  // eslint-disable-next-line require-atomic-updates
  context.deviceId = deviceId;
}
