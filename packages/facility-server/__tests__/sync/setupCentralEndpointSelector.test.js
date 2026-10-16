import { afterEach, describe, expect, it, vi } from 'vitest';

import { FACT_CENTRAL_ENDPOINT_IN_USE } from '@tamanu/constants';

import { setCentralEndpointSelector } from '../../app/sync/CentralEndpointSelector';
import { setupCentralEndpointSelector } from '../../app/sync/setupCentralEndpointSelector';

const makeContext = (facts = {}) => {
  const closeHooks = [];
  return {
    closeHooks,
    models: {
      LocalSystemFact: {
        get: async key => facts[key] ?? null,
        set: async (key, value) => void (facts[key] = value),
      },
    },
    settings: { global: { get: async () => undefined } },
    deviceId: 'device',
    onClose: hook => closeHooks.push(hook),
  };
};

// spec: CEND
describe('setupCentralEndpointSelector', () => {
  afterEach(() => {
    setCentralEndpointSelector(null);
    vi.useRealTimers();
  });

  it('gives a process one selector however many times its runtime is set up', async () => {
    // the sync process sets the runtime up for the app and again for the task runner it hosts
    const first = makeContext();
    const second = makeContext();

    const selector = await setupCentralEndpointSelector(first, { role: 'owner' });
    const again = await setupCentralEndpointSelector(second, { role: 'owner' });

    expect(again).toBe(selector);
    expect(second.endpointSelector).toBe(selector);
    // one recheck timer, not two
    expect(first.closeHooks).toHaveLength(1);
    expect(second.closeHooks).toHaveLength(0);
  });

  it('does not let a later follower take over an owner', async () => {
    const owner = await setupCentralEndpointSelector(makeContext(), { role: 'owner' });
    const later = await setupCentralEndpointSelector(makeContext(), { role: 'follower' });

    expect(later).toBe(owner);
    expect(later.canFailOver()).toBe(owner.canFailOver());
  });

  it('starts the recheck timer for an owner only', async () => {
    const owner = makeContext();
    await setupCentralEndpointSelector(owner, { role: 'owner' });
    expect(owner.closeHooks).toHaveLength(1);

    setCentralEndpointSelector(null);
    const standalone = makeContext();
    await setupCentralEndpointSelector(standalone, { role: 'standalone' });
    expect(standalone.closeHooks).toHaveLength(0);
  });

  it('makes a follower follow the endpoint the sync process published, and never probe', async () => {
    vi.useFakeTimers();
    const context = makeContext({
      [FACT_CENTRAL_ENDPOINT_IN_USE]: 'https://published.example.com',
    });

    const selector = await setupCentralEndpointSelector(context, { role: 'follower' });
    await vi.advanceTimersByTimeAsync(0);

    expect(context.closeHooks).toHaveLength(1);
    expect(selector.current()).toBe('https://published.example.com');
    expect(selector.canFailOver()).toBe(false);
    expect(await selector.walk()).toBe(false);
    context.closeHooks.forEach(stop => stop());
  });
});
