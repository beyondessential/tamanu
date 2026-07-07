import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';
import { isEncryptedSecret } from '@tamanu/shared/utils/crypto';

import { writeSyncConfig } from '../../app/subCommands/setupSync';
import { createTestContext } from '../utilities';

describe('setupSync', () => {
  let ctx;
  let models;

  const config = {
    host: 'https://central.example.com',
    email: 'sync.test@sync.tamanu',
    password: 'super-secret-pw',
    facilityIds: ['facility-a'],
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx);
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.LocalSystemFact.destroy({
      where: { key: [FACT_CENTRAL_HOST, FACT_SYNC_EMAIL, FACT_FACILITY_IDS] },
      force: true,
    });
    await models.LocalSystemSecret.destroy({ where: { key: FACT_SYNC_PASSWORD }, force: true });
  });

  it('writes all sync facts when the server is unconfigured', async () => {
    const wrote = await writeSyncConfig(ctx, config);

    expect(wrote).toBe(true);
    expect(await models.LocalSystemFact.get(FACT_CENTRAL_HOST)).toBe(config.host);
    expect(await models.LocalSystemFact.get(FACT_SYNC_EMAIL)).toBe(config.email);
    expect(JSON.parse(await models.LocalSystemFact.get(FACT_FACILITY_IDS))).toEqual(
      config.facilityIds,
    );
    expect(await models.LocalSystemSecret.get(FACT_SYNC_PASSWORD)).toBe(config.password);
  });

  it('stores the password encrypted, not as plaintext', async () => {
    await writeSyncConfig(ctx, config);

    const row = await models.LocalSystemSecret.findOne({ where: { key: FACT_SYNC_PASSWORD } });
    expect(row.value).not.toBe(config.password);
    expect(isEncryptedSecret(row.value)).toBe(true);
  });

  it('skips an already-configured server without force', async () => {
    await writeSyncConfig(ctx, config);
    const wrote = await writeSyncConfig(ctx, { ...config, password: 'rotated-pw' });

    expect(wrote).toBe(false);
    expect(await models.LocalSystemSecret.get(FACT_SYNC_PASSWORD)).toBe(config.password);
  });

  it('overwrites an existing configuration with force', async () => {
    await writeSyncConfig(ctx, config);
    const wrote = await writeSyncConfig(ctx, { ...config, password: 'rotated-pw', force: true });

    expect(wrote).toBe(true);
    expect(await models.LocalSystemSecret.get(FACT_SYNC_PASSWORD)).toBe('rotated-pw');
  });

  it('throws when required sync config is missing', async () => {
    await expect(
      writeSyncConfig(ctx, { host: '', email: '', password: '', facilityIds: [] }),
    ).rejects.toThrow(/SYNC_URL/);
  });
});
