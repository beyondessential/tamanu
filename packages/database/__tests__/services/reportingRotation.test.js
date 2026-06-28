import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FACT_REPORTING_ROLE_SECRET, FACT_REPORTING_SECRET_ROTATED_AT } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings/cache';

import { getReportingSecret } from '../../src/services/reporting';
import { closeDatabase, createTestDatabase } from '../utilities';

const ROTATION_SETTING = 'reportingDb.secretRotationDays';
const daysAgo = days => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('reporting secret rotation', () => {
  let store;
  let models;

  beforeAll(async () => {
    store = await createTestDatabase();
    ({ models } = store);
  });
  beforeEach(async () => {
    await models.LocalSystemSecret.destroy({ where: { key: FACT_REPORTING_ROLE_SECRET }, force: true });
    await models.LocalSystemFact.destroy({ where: { key: FACT_REPORTING_SECRET_ROTATED_AT }, force: true });
    await models.Setting.destroy({ where: { key: ROTATION_SETTING }, force: true });
    settingsCache.reset();
  });
  afterAll(async () => {
    await closeDatabase();
  });

  it('generates a secret and records the rotation time on first use', async () => {
    const secret = await getReportingSecret(store);
    expect(secret).toEqual(expect.any(String));
    expect(await models.LocalSystemFact.get(FACT_REPORTING_SECRET_ROTATED_AT)).toBeTruthy();
    expect(await getReportingSecret(store)).toBe(secret); // stable, not stale
  });

  it('seeds the timestamp for a pre-existing secret without rotating it', async () => {
    await models.LocalSystemSecret.set(FACT_REPORTING_ROLE_SECRET, 'pre-existing');
    expect(await models.LocalSystemFact.get(FACT_REPORTING_SECRET_ROTATED_AT)).toBeNull();

    const secret = await getReportingSecret(store);

    expect(secret).toBe('pre-existing'); // kept, not rotated
    expect(await models.LocalSystemFact.get(FACT_REPORTING_SECRET_ROTATED_AT)).toBeTruthy(); // backfilled
  });

  it('rotates the secret once the timestamp is older than the policy', async () => {
    await models.LocalSystemSecret.set(FACT_REPORTING_ROLE_SECRET, 'old-secret');
    await models.LocalSystemFact.set(FACT_REPORTING_SECRET_ROTATED_AT, daysAgo(91));

    const secret = await getReportingSecret(store);

    expect(secret).not.toBe('old-secret');
    const rotatedAt = await models.LocalSystemFact.get(FACT_REPORTING_SECRET_ROTATED_AT);
    expect(Date.now() - new Date(rotatedAt).getTime()).toBeLessThan(60 * 1000); // reset to ~now
    expect(await getReportingSecret(store)).toBe(secret);
  });

  it('does not rotate when the setting disables it (0 days)', async () => {
    await models.Setting.set(ROTATION_SETTING, 0);
    settingsCache.reset();
    await models.LocalSystemSecret.set(FACT_REPORTING_ROLE_SECRET, 'kept-secret');
    await models.LocalSystemFact.set(FACT_REPORTING_SECRET_ROTATED_AT, daysAgo(400));

    expect(await getReportingSecret(store)).toBe('kept-secret');
  });

  it('honours a custom rotation interval from the setting', async () => {
    await models.Setting.set(ROTATION_SETTING, 7);
    settingsCache.reset();
    await models.LocalSystemSecret.set(FACT_REPORTING_ROLE_SECRET, 'weekly-secret');
    await models.LocalSystemFact.set(FACT_REPORTING_SECRET_ROTATED_AT, daysAgo(10));

    expect(await getReportingSecret(store)).not.toBe('weekly-secret'); // 10 > 7 → rotated
  });
});
