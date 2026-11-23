import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FACT_FACILITY_IDS, SETTINGS_SCOPES } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK, FACT_LAST_SUCCESSFUL_SYNC_PULL } from '@tamanu/constants/facts';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { createTestContext } from '../utilities';
import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';

const HEARTBEAT_KEY = 'fhir.worker.heartbeat';
const BASELINE_HEARTBEAT_ID = '44fbfb10-3019-44f8-b0c5-d02b860e521e';

describe('FacilitySyncManager settings on first sync', () => {
  let ctx;
  let models;
  let sequelize;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await sequelize.query('DELETE FROM settings');
    await models.FacilitySettingMigration.destroy({ where: {}, force: true });
    await models.LocalSystemFact.destroy({
      where: { key: FACT_LAST_SUCCESSFUL_SYNC_PULL },
      force: true,
    });
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '50');
  });

  const insertSetting = ({
    id = crypto.randomUUID(),
    key,
    value,
    scope = SETTINGS_SCOPES.GLOBAL,
    facilityId = null,
  }) =>
    sequelize.query(
      `INSERT INTO settings (id, key, value, scope, facility_id)
       VALUES (:id, :key, :value, :scope, :facilityId)`,
      { replacements: { id, key, value, scope, facilityId } },
    );

  const settingsWithKey = async key =>
    (await models.Setting.findAll({ where: { key }, raw: true })).map(({ id, value }) => ({
      id,
      value,
    }));

  const centralHeartbeat = () => ({
    id: crypto.randomUUID(),
    key: HEARTBEAT_KEY,
    value: '2 minutes',
    scope: SETTINGS_SCOPES.GLOBAL,
    facilityId: null,
  });

  const asSyncRecord = (setting, index) => ({
    id: String(index + 1),
    recordType: 'settings',
    recordId: setting.id,
    isDeleted: false,
    data: { ...setting, updatedAtSyncTick: SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER },
  });

  const makeSyncManager = ({ bootstrap, pulled = [], isQueued = false } = {}) =>
    new FacilitySyncManager({
      models,
      sequelize,
      centralServer: {
        streaming: () => false,
        fetchBootstrap: async () => {
          if (!bootstrap) throw new Error('central unreachable');
          return bootstrap.map(asSyncRecord);
        },
        startSyncSession: async () =>
          isQueued ? { status: 'queued' } : { sessionId: crypto.randomUUID(), startedAtTick: 200 },
        endSyncSession: async () => ({}),
        initiatePull: async () => ({ totalToPull: pulled.length, pullUntil: 200 }),
        pull: async () => pulled.map(asSyncRecord),
        push: vi.fn(),
        completePush: vi.fn(),
        markSessionErrored: vi.fn(),
        fetch: vi.fn(),
      },
    });

  it("replaces settings the facility seeded itself with central's on its first pull", async () => {
    await insertSetting({ id: BASELINE_HEARTBEAT_ID, key: HEARTBEAT_KEY, value: '"1 minute"' });
    const fromCentral = centralHeartbeat();

    await makeSyncManager({ pulled: [fromCentral] }).runSync();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([
      { id: fromCentral.id, value: '2 minutes' },
    ]);
  });

  it("applies central's settings in the bootstrap of a facility that seeded its own", async () => {
    await insertSetting({ id: BASELINE_HEARTBEAT_ID, key: HEARTBEAT_KEY, value: '"1 minute"' });
    const fromCentral = centralHeartbeat();

    await makeSyncManager({ bootstrap: [fromCentral], isQueued: true }).runSync();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([
      { id: fromCentral.id, value: '2 minutes' },
    ]);
  });

  it('keeps settings central already delivered when a first sync is attempted again', async () => {
    const fromCentral = centralHeartbeat();
    await makeSyncManager({ bootstrap: [fromCentral], isQueued: true }).runSync();
    await insertSetting({ key: 'features.reminderContactModule.enabled', value: 'false' });

    await makeSyncManager({ isQueued: true }).runSync();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([
      { id: fromCentral.id, value: '2 minutes' },
    ]);
    expect(await settingsWithKey('features.reminderContactModule.enabled')).toEqual([]);
  });

  it('keeps facility-scoped settings and settings migration carriers', async () => {
    const [facilityId] = JSON.parse(await models.LocalSystemFact.get(FACT_FACILITY_IDS));
    const facilitySettingId = crypto.randomUUID();
    await insertSetting({
      id: facilitySettingId,
      key: 'templates.letterhead.title',
      value: '"Clinic"',
      scope: SETTINGS_SCOPES.FACILITY,
      facilityId,
    });
    const carrier = await models.FacilitySettingMigration.create({
      key: 'templates.letterhead.title',
      value: 'Clinic',
      facilityId,
    });

    await makeSyncManager({ isQueued: true }).runSync();

    expect(await settingsWithKey('templates.letterhead.title')).toEqual([
      { id: facilitySettingId, value: 'Clinic' },
    ]);
    expect(await models.FacilitySettingMigration.findByPk(carrier.id)).not.toBeNull();
  });

  it('leaves the settings of a facility that has already pulled alone', async () => {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '10');
    await insertSetting({ id: BASELINE_HEARTBEAT_ID, key: HEARTBEAT_KEY, value: '"1 minute"' });

    await makeSyncManager().runSync();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([
      { id: BASELINE_HEARTBEAT_ID, value: '1 minute' },
    ]);
  });
});
