import { LocalSystemFact } from '@tamanu/shared/models/LocalSystemFact';
import { initDeviceId } from '../../app/sync/initDeviceId';
import { createTestContext } from '../utilities';

jest.mock('shortid', () => () => 'test-device-id');

describe('initDeviceId', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  it('should generate a deviceId if one does not exist', async () => {
    await LocalSystemFact.set('deviceId', null);
    await initDeviceId(ctx);
    const newDeviceId = await models.LocalSystemFact.get('deviceId');
    expect(ctx.deviceId).toBe('facility-test-device-id');
    expect(newDeviceId).toBe('facility-test-device-id');
  });
  it('should use existing deviceId if one already exists', async () => {
    const testDeviceId = 'test-device-id-existing';
    await LocalSystemFact.set('deviceId', testDeviceId);
    await initDeviceId(ctx);
    const deviceId = await models.LocalSystemFact.get('deviceId');
    expect(ctx.deviceId).toBe(testDeviceId);
    expect(deviceId).toBe(testDeviceId);
  });
});
