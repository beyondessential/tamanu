import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

  it('seeds from TAMANU_DEVICE_ID and rejects a mismatch with the recorded id', async () => {
    process.env.TAMANU_DEVICE_ID = 'facility-from-env';
    try {
      await models.LocalSystemFact.destroy({ where: { key: FACT_DEVICE_ID }, force: true });
      await initDeviceId({ context: ctx, deviceType: DEVICE_TYPES.FACILITY_SERVER });
      expect(await models.LocalSystemFact.get(FACT_DEVICE_ID)).toBe('facility-from-env');

      process.env.TAMANU_DEVICE_ID = 'facility-other';
      await expect(
        initDeviceId({ context: ctx, deviceType: DEVICE_TYPES.FACILITY_SERVER }),
      ).rejects.toThrow('Device ID mismatch');
    } finally {
      delete process.env.TAMANU_DEVICE_ID;
    }
  });
});
