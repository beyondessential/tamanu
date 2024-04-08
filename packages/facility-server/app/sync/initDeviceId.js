import config from 'config';
import shortid from 'shortid';

export async function initDeviceId(context) {
  const { LocalSystemFact } = context.models;
  let deviceId = await LocalSystemFact.get('deviceId');
  if (!deviceId) {
    deviceId = config.deviceId ?? `facility-${shortid()}`;
    await LocalSystemFact.set('deviceId', deviceId);
  } else if (config.deviceId && deviceId !== config.deviceId) {
    throw new Error(
      `Device ID mismatch: ${deviceId} (from database) vs ${config.deviceId} (from config)`,
    );
  }
  // eslint-disable-next-line require-atomic-updates
  context.deviceId = deviceId;
}
