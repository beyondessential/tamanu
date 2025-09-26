import { FACT_DEVICE_ID } from '@tamanu/constants/facts';
import { initDeviceId } from '@tamanu/shared/utils';
import { DEVICE_TYPES } from '@tamanu/constants';

import { createTestContext } from '../utilities';

describe('initDeviceId', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  const deviceIdRegex = /^facility-.+$/;

  it('should generate a deviceId if one does not exist', async () => {
    await models.LocalSystemFact.delete(FACT_DEVICE_ID);
    await initDeviceId({ context: ctx, deviceType: DEVICE_TYPES.FACILITY_SERVER });
    const newDeviceId = await models.LocalSystemFact.get(FACT_DEVICE_ID);
    expect(ctx.deviceId).toMatch(deviceIdRegex);
    expect(newDeviceId).toMatch(deviceIdRegex);
  });

  it('should use existing deviceId if one already exists', async () => {
    const testDeviceId = 'test-device-id-existing';
    await models.LocalSystemFact.set(FACT_DEVICE_ID, testDeviceId);
    await initDeviceId({ context: ctx, deviceType: DEVICE_TYPES.FACILITY_SERVER });
    const deviceId = await models.LocalSystemFact.get(FACT_DEVICE_ID);
    expect(ctx.deviceId).toBe(testDeviceId);
    expect(deviceId).toBe(testDeviceId);
  });
});
