import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  FACT_CENTRAL_HOST,
  FACT_CURRENT_SYNC_TICK,
  FACT_CURRENT_VERSION,
  FACT_DEVICE_ID,
  FACT_DEVICE_KEY,
  FACT_FACILITY_IDS,
  FACT_META_SERVER_ID,
  FACT_SETTINGS_PSK,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
} from '@tamanu/constants';

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

  const remainingKeys = async model =>
    (await model.findAll({ attributes: ['key'], order: [['key', 'ASC']] })).map(row => row.key);

  it('removes every secret and the identity, and keeps every other fact', async () => {
    await models.LocalSystemFact.set(FACT_CENTRAL_HOST, 'https://central.example');
    await models.LocalSystemFact.set(FACT_SYNC_EMAIL, 'sync@example');
    await models.LocalSystemFact.set(FACT_FACILITY_IDS, '["facility-a"]');
    await models.LocalSystemFact.set(FACT_DEVICE_ID, 'device-a');
    await models.LocalSystemFact.set(FACT_META_SERVER_ID, 'meta-a');
    await models.LocalSystemFact.set(FACT_CURRENT_VERSION, '2.67.0');
    await sequelize.query(
      `INSERT INTO local_system_facts (key, value) VALUES ('legacySecret', 'S1:aXY=:Y2lwaGVy')`,
    );
    await models.LocalSystemSecret.set(FACT_SYNC_PASSWORD, 'password');
    await models.LocalSystemSecret.set(FACT_DEVICE_KEY, 'device-key');
    await models.LocalSystemSecret.set(FACT_SETTINGS_PSK, 'settings-psk');

    await sequelize.query('SELECT forget_server_identity()');

    expect(await remainingKeys(models.LocalSystemFact)).toEqual([
      FACT_CURRENT_SYNC_TICK,
      FACT_CURRENT_VERSION,
    ]);
    expect(await remainingKeys(models.LocalSystemSecret)).toEqual([]);
  });

  it('soft-deletes secret settings and keeps the rest', async () => {
    await models.Setting.set('integrations.dhis2.password', 'S1:aXY=:Y2lwaGVy');
    await models.Setting.set('mail.from', 'tamanu@example');

    await sequelize.query('SELECT forget_server_identity()');

    const live = await models.Setting.findAll({ attributes: ['key'] });
    expect(live.map(row => row.key)).toEqual(['mail.from']);
    const deleted = await models.Setting.findOne({
      where: { key: 'integrations.dhis2.password' },
      paranoid: false,
    });
    expect(deleted?.deletedAt).toBeTruthy();
  });

  it('lets a forgotten identity be set up again', async () => {
    await models.LocalSystemFact.set(FACT_CENTRAL_HOST, 'https://central.example');
    await sequelize.query('SELECT forget_server_identity()');

    await models.LocalSystemFact.set(FACT_CENTRAL_HOST, 'https://other.example');
    expect(await models.LocalSystemFact.get(FACT_CENTRAL_HOST)).toBe('https://other.example');
  });
});
