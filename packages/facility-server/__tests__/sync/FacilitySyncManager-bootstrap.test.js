import { describe, expect, it, vi } from 'vitest';
import { FACT_LAST_SUCCESSFUL_SYNC_PULL } from '@tamanu/constants/facts';

vi.mock('../../app/sync/facilityBootstrap', () => ({ applyBootstrap: vi.fn() }));

const { applyBootstrap } = await import('../../app/sync/facilityBootstrap');
const { FacilitySyncManager } = await import('../../app/sync/FacilitySyncManager');

// spec: FBOOT#when-a-facility-bootstraps
describe('FacilitySyncManager bootstrap', () => {
  const records = [
    { recordType: 'facilities', recordId: 'facility-a', data: { id: 'facility-a' } },
  ];

  const makeSyncManager = ({ facts = {}, fetchBootstrap = async () => records } = {}) => {
    const factStore = new Map(Object.entries(facts));
    const calls = [];
    let isInsideTransaction = false;
    applyBootstrap.mockReset();
    applyBootstrap.mockImplementation(async () => {
      calls.push(isInsideTransaction ? 'applyBootstrap in transaction' : 'applyBootstrap');
    });

    const syncManager = new FacilitySyncManager({
      models: {
        LocalSystemFact: {
          get: async key => factStore.get(key) ?? null,
          set: async (key, value) => void factStore.set(key, value),
        },
        LocalSystemSecret: { get: async () => 'psk' },
      },
      sequelize: {
        getQueryInterface: () => ({ dropSchema: vi.fn(), createSchema: vi.fn() }),
        query: () => true,
        transaction: async callback => {
          isInsideTransaction = true;
          try {
            return await callback();
          } finally {
            isInsideTransaction = false;
          }
        },
      },
      centralServer: {
        streaming: () => false,
        fetchBootstrap: vi.fn(async () => {
          calls.push('fetchBootstrap');
          return fetchBootstrap();
        }),
        startSyncSession: vi.fn(() => {
          calls.push('startSyncSession');
          return { sessionId: 'sync123', tick: 1 };
        }),
        endSyncSession: vi.fn(),
        fetch: vi.fn(),
      },
    });
    vi.spyOn(syncManager, 'pullChanges').mockImplementation(() => true);
    vi.spyOn(syncManager, 'pushChanges').mockImplementation(() => true);
    return { syncManager, calls };
  };

  it('applies the bootstrap in a transaction before the first sync session starts', async () => {
    const { syncManager, calls } = makeSyncManager();

    await syncManager.runSync();

    expect(calls).toEqual(['fetchBootstrap', 'applyBootstrap in transaction', 'startSyncSession']);
    expect(applyBootstrap).toHaveBeenCalledWith(expect.anything(), records);
  });

  it('does not bootstrap once the pull cursor is set', async () => {
    const { syncManager, calls } = makeSyncManager({
      facts: { [FACT_LAST_SUCCESSFUL_SYNC_PULL]: '100' },
    });

    await syncManager.runSync();

    expect(calls).toEqual(['startSyncSession']);
  });

  it('bootstraps once per process, not before every attempt', async () => {
    const { syncManager, calls } = makeSyncManager();

    await syncManager.runSync();
    await syncManager.runSync();

    expect(calls.filter(call => call === 'fetchBootstrap')).toHaveLength(1);
  });

  it('runs the sync session when the bootstrap fails, and retries it on the next attempt', async () => {
    const fetchBootstrap = vi
      .fn()
      .mockRejectedValueOnce(new Error('central unreachable'))
      .mockResolvedValueOnce(records);
    const { syncManager, calls } = makeSyncManager({ fetchBootstrap });

    await expect(syncManager.runSync()).resolves.toEqual({ queued: false, ran: true });
    expect(calls).toEqual(['fetchBootstrap', 'startSyncSession']);

    await syncManager.runSync();
    expect(calls.slice(2)).toEqual([
      'fetchBootstrap',
      'applyBootstrap in transaction',
      'startSyncSession',
    ]);
  });
});
