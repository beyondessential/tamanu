import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FACT_FACILITY_IDS, SETTINGS_SCOPES } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK, FACT_LAST_SUCCESSFUL_SYNC_PULL } from '@tamanu/constants/facts';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { createTestContext } from '../utilities';
import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import { clearLocallyAuthoredSettings } from '../../app/sync/facilityBootstrap';

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

  it('keeps settings the bootstrap delivered when the first pull follows it', async () => {
    const REMINDER_KEY = 'features.reminderContactModule.enabled';
    const fromBootstrap = centralHeartbeat();
    await makeSyncManager({ bootstrap: [fromBootstrap], isQueued: true }).runSync();
    await insertSetting({ key: REMINDER_KEY, value: 'false' });
    const fromPull = {
      id: crypto.randomUUID(),
      key: REMINDER_KEY,
      value: true,
      scope: SETTINGS_SCOPES.GLOBAL,
      facilityId: null,
    };

    await makeSyncManager({ pulled: [fromPull] }).runSync();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([
      { id: fromBootstrap.id, value: '2 minutes' },
    ]);
    expect(await settingsWithKey(REMINDER_KEY)).toEqual([{ id: fromPull.id, value: true }]);
  });

  it('keeps seeded settings when the first pull fails to save', async () => {
    await insertSetting({ id: BASELINE_HEARTBEAT_ID, key: HEARTBEAT_KEY, value: '"1 minute"' });

    await expect(
      makeSyncManager({ pulled: [centralHeartbeat(), centralHeartbeat()] }).runSync(),
    ).rejects.toThrow();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([
      { id: BASELINE_HEARTBEAT_ID, value: '1 minute' },
    ]);
  });

  it('clears seeded settings on a first pull that brings no records', async () => {
    await insertSetting({ id: BASELINE_HEARTBEAT_ID, key: HEARTBEAT_KEY, value: '"1 minute"' });

    await makeSyncManager().runSync();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([]);
  });

  it('keeps seeded settings when no pull completes', async () => {
    await insertSetting({ id: BASELINE_HEARTBEAT_ID, key: HEARTBEAT_KEY, value: '"1 minute"' });

    await makeSyncManager({ isQueued: true }).runSync();

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([
      { id: BASELINE_HEARTBEAT_ID, value: '1 minute' },
    ]);
  });

  it('keeps facility-scoped and central-scoped settings and settings migration carriers', async () => {
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

    const centralScopedId = crypto.randomUUID();
    await insertSetting({
      id: centralScopedId,
      key: 'sync.maxFlaggedPatientsPerBuild',
      value: '500',
      scope: SETTINGS_SCOPES.CENTRAL,
    });

    await makeSyncManager({ pulled: [centralHeartbeat()] }).runSync();

    expect(await settingsWithKey('templates.letterhead.title')).toEqual([
      { id: facilitySettingId, value: 'Clinic' },
    ]);
    expect(await settingsWithKey('sync.maxFlaggedPatientsPerBuild')).toEqual([
      { id: centralScopedId, value: 500 },
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

  it('keeps the cleared settings out of the changelog', async () => {
    const id = crypto.randomUUID();
    await insertSetting({ id, key: HEARTBEAT_KEY, value: '"1 minute"' });

    await sequelize.transaction(() => clearLocallyAuthoredSettings(sequelize));

    expect(await settingsWithKey(HEARTBEAT_KEY)).toEqual([]);
    const [deletions] = await sequelize.query(
      'SELECT id FROM logs.changes WHERE record_id = :id AND is_hard_delete',
      { replacements: { id } },
    );
    expect(deletions).toEqual([]);
  });
});
