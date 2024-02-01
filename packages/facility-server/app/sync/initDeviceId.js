import shortid from 'shortid';

export async function initDeviceId(context) {
  const { LocalSystemFact } = context.models;
  let deviceId = await LocalSystemFact.get('deviceId');
  if (!deviceId) {
    deviceId = `facility-${shortid()}`;
    await LocalSystemFact.set('deviceId', deviceId);
  }
  // eslint-disable-next-line require-atomic-updates
  context.deviceId = deviceId;
}
