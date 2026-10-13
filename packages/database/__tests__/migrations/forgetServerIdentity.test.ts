import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  FACT_CENTRAL_HOST,
  FACT_CURRENT_SYNC_TICK,
  FACT_CURRENT_VERSION,
  FACT_DEVICE_KEY,
  FACT_SETTINGS_PSK,
  FACT_SYNC_PASSWORD,
  SERVER_IDENTITY_FACTS,
} from '@tamanu/constants';
import { encryptSecret, generateSecretKey } from '@tamanu/shared/utils/crypto';

import { closeDatabase, createTestDatabase } from '../utilities';

describe('forget_server_identity()', () => {
  let models;
  let sequelize;

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await models.LocalSystemFact.destroy({ where: {}, force: true });
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '42');
    await models.LocalSystemSecret.destroy({ where: {}, force: true });
    await models.Setting.destroy({ where: {}, force: true });
  });

  const encrypted = async () => encryptSecret(await generateSecretKey(), 'secret');

  const forget = () =>
    sequelize.transaction(async () => {
      await sequelize.query(`SELECT set_config('tamanu.this_is_a_copy', 'true', true)`);
      await sequelize.query('SELECT forget_server_identity()');
    });

  const remainingKeys = async model =>
    (await model.findAll({ attributes: ['key'], order: [['key', 'ASC']] })).map(row => row.key);

  it('removes every secret and the identity, and keeps every other fact', async () => {
    for (const key of SERVER_IDENTITY_FACTS) {
      await models.LocalSystemFact.set(key, 'source-server-value');
    }
    await models.LocalSystemFact.set(FACT_CURRENT_VERSION, '2.67.0');
    await sequelize.query(
      `INSERT INTO local_system_facts (key, value) VALUES ('legacySecret', $value)`,
      {
        bind: { value: await encrypted() },
      },
    );
    await models.LocalSystemSecret.set(FACT_SYNC_PASSWORD, 'password');
    await models.LocalSystemSecret.set(FACT_DEVICE_KEY, 'device-key');
    await models.LocalSystemSecret.set(FACT_SETTINGS_PSK, 'settings-psk');

    await forget();

    expect(await remainingKeys(models.LocalSystemFact)).toEqual([
      FACT_CURRENT_SYNC_TICK,
      FACT_CURRENT_VERSION,
    ]);
    expect(await remainingKeys(models.LocalSystemSecret)).toEqual([]);
  });

  it('soft-deletes secret settings and keeps the rest', async () => {
    await models.Setting.set('integrations.dhis2.password', await encrypted());
    await models.Setting.set('mail.from', 'tamanu@example');

    await forget();

    const live = await models.Setting.findAll({ attributes: ['key'] });
    expect(live.map(row => row.key)).toEqual(['mail.from']);
    const deleted = await models.Setting.findOne({
      where: { key: 'integrations.dhis2.password' },
      paranoid: false,
    });
    expect(deleted?.deletedAt).toBeTruthy();
  });

  it('marks forgotten settings for the next sync to facilities', async () => {
    await models.Setting.set('integrations.dhis2.password', await encrypted());
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '43');

    await forget();

    const deleted = await models.Setting.findOne({
      where: { key: 'integrations.dhis2.password' },
      paranoid: false,
    });
    expect(deleted?.updatedAtSyncTick).toBe('43');
  });

  it('refuses unless the transaction declares a copy, and changes nothing', async () => {
    await models.LocalSystemFact.set(FACT_CENTRAL_HOST, 'https://central.example');
    await models.LocalSystemSecret.set(FACT_DEVICE_KEY, 'device-key');

    await expect(sequelize.query('SELECT forget_server_identity()')).rejects.toThrow(
      /only runs on a copy/,
    );
    await forget();
    await models.LocalSystemSecret.set(FACT_DEVICE_KEY, 'device-key');
    await expect(sequelize.query('SELECT forget_server_identity()')).rejects.toThrow(
      /only runs on a copy/,
    );

    expect(await models.LocalSystemSecret.get(FACT_DEVICE_KEY)).toBe('device-key');
  });

  it('is found by the signature upgrade and ops look it up by', async () => {
    const [[{ name }]] = await sequelize.query(
      `SELECT to_regprocedure('public.forget_server_identity()')::text AS name`,
    );
    expect(name).toBe('forget_server_identity()');
  });

  it('is not executable by PUBLIC', async () => {
    const [[{ allowed }]] = await sequelize.query(
      `SELECT has_function_privilege('public', 'public.forget_server_identity()', 'EXECUTE') AS allowed`,
    );
    expect(allowed).toBe(false);
  });

  it('lets a forgotten identity be set up again', async () => {
    await models.LocalSystemFact.set(FACT_CENTRAL_HOST, 'https://central.example');
    await forget();

    await models.LocalSystemFact.set(FACT_CENTRAL_HOST, 'https://other.example');
    expect(await models.LocalSystemFact.get(FACT_CENTRAL_HOST)).toBe('https://other.example');
  });
});
