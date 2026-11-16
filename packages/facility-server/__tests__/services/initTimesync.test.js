import { afterEach, describe, expect, it, vi } from 'vitest';

import { initTimesync } from '../../app/services/initTimesync';

const makeModels = () => {
  const facts = new Map();
  return {
    LocalSystemFact: {
      get: async key => facts.get(key) ?? null,
      set: async (key, value) => void facts.set(key, value),
    },
  };
};

// spec: CEND
describe('initTimesync', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks the URL for each exchange, so it follows the central endpoint in use', async () => {
    const fetched = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async url => {
        fetched.push(url);
        throw new Error('stop here');
      }),
    );
    let url = 'https://a.example.com/api/timesync';
    const timesync = await initTimesync({
      models: makeModels(),
      getUrl: () => url,
      enabled: true,
    });

    await timesync.attemptSync({ samples: 3, jitter: 1 }).catch(() => {});
    expect(new Set(fetched)).toEqual(new Set(['https://a.example.com/api/timesync']));

    fetched.length = 0;
    url = 'https://b.example.com/api/timesync';
    await timesync.attemptSync({ samples: 3, jitter: 1 }).catch(() => {});
    expect(new Set(fetched)).toEqual(new Set(['https://b.example.com/api/timesync']));
  });
});
