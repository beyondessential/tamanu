import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';

import { FACT_DEVICE_KEY } from '@tamanu/constants/facts';
import { isEncryptedSecret } from '@tamanu/shared/utils/crypto';

import { closeDatabase, createTestDatabase } from '../utilities';

// Encryption on local_system_secrets is non-optional: every value is encrypted
// at rest and there is no plaintext accessor.
describe('LocalSystemSecret', () => {
  let models;
  beforeAll(async () => {
    ({ models } = await createTestDatabase());
  });
  beforeEach(async () => {
    await models.LocalSystemSecret.destroy({ where: {}, force: true });
  });
  afterAll(async () => {
    await closeDatabase();
  });

  const rawValue = async (key) =>
    (await models.LocalSystemSecret.findOne({ where: { key } }))?.value;

  it('encrypts values at rest and round-trips them', async () => {
    const secret = 'super-secret-value';
    await models.LocalSystemSecret.set(FACT_DEVICE_KEY, secret);

    const stored = await rawValue(FACT_DEVICE_KEY);
    expect(stored).not.toBe(secret);
    expect(isEncryptedSecret(stored)).toBe(true);

    expect(await models.LocalSystemSecret.get(FACT_DEVICE_KEY)).toBe(secret);
  });

  it('encrypts via setIfAbsent and keeps the first value', async () => {
    await models.LocalSystemSecret.setIfAbsent(FACT_DEVICE_KEY, 'first');
    expect(isEncryptedSecret(await rawValue(FACT_DEVICE_KEY))).toBe(true);

    await models.LocalSystemSecret.setIfAbsent(FACT_DEVICE_KEY, 'second');
    expect(await models.LocalSystemSecret.get(FACT_DEVICE_KEY)).toBe('first');
  });

  it('self-heals a legacy plaintext value on read', async () => {
    // Simulate a row moved from local_system_facts before encryption was
    // mandatory by writing plaintext straight to the column.
    await models.LocalSystemSecret.create({
      id: crypto.randomUUID(),
      key: FACT_DEVICE_KEY,
      value: 'legacy-plaintext',
    });
    expect(isEncryptedSecret(await rawValue(FACT_DEVICE_KEY))).toBe(false);

    expect(await models.LocalSystemSecret.get(FACT_DEVICE_KEY)).toBe('legacy-plaintext');
    expect(isEncryptedSecret(await rawValue(FACT_DEVICE_KEY))).toBe(true);
  });
});
