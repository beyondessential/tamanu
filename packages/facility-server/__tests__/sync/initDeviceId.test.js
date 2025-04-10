import { FACT_DEVICE_ID } from '@tamanu/constants/facts';
import { LocalSystemFact } from '@tamanu/database';
import { initDeviceId } from '../../dist/sync/initDeviceId';
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
    await LocalSystemFact.set(FACT_DEVICE_ID, null);
    await initDeviceId(ctx);
    const newDeviceId = await models.LocalSystemFact.get(FACT_DEVICE_ID);
    expect(ctx.deviceId).toBe('facility-test-device-id');
    expect(newDeviceId).toBe('facility-test-device-id');
  });
  it('should use existing deviceId if one already exists', async () => {
    const testDeviceId = 'test-device-id-existing';
    await LocalSystemFact.set(FACT_DEVICE_ID, testDeviceId);
    await initDeviceId(ctx);
    const deviceId = await models.LocalSystemFact.get(FACT_DEVICE_ID);
    expect(ctx.deviceId).toBe(testDeviceId);
    expect(deviceId).toBe(testDeviceId);
  });
});
