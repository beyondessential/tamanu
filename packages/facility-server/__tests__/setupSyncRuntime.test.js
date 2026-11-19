import { describe, expect, it, vi } from 'vitest';
import { ReadSettings } from '@tamanu/settings/reader';

vi.mock('../app/serverConfig', async importOriginal => ({
  ...(await importOriginal()),
  initServerConfig: async () => {},
  isServerConfigured: () => true,
  getServerFacilityIds: () => ['facility-set-up-later'],
}));

const { startSyncRuntimeWhenConfigured } = await import('../app/setupSyncRuntime');

describe('startSyncRuntimeWhenConfigured', () => {
  it('gives the runtime a settings reader for facilities configured after boot', async () => {
    const context = { models: {}, settings: { global: {} } };
    const setup = vi.fn(async () => {});

    const cancel = startSyncRuntimeWhenConfigured(context, { intervalMs: 5, setup });
    await vi.waitFor(() => expect(setup).toHaveBeenCalled());
    cancel();

    expect(context.settings['facility-set-up-later']).toBeInstanceOf(ReadSettings);
  });
});
