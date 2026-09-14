import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from './utilities';
import { clearAnthropicModelCache } from '../app/anthropicModelSuggestions';

jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingSecret: jest.fn(),
  };
});

const { getSettingSecret } = jest.requireMock('@tamanu/shared/utils/crypto');

const withVision = {
  image_input: { supported: true },
  pdf_input: { supported: true },
};

const MODELS_RESPONSE = {
  data: [
    { id: 'claude-opus-5', display_name: 'Claude Opus 5', capabilities: withVision },
    {
      id: 'claude-textonly-1',
      display_name: 'Claude Text Only',
      capabilities: { image_input: { supported: false }, pdf_input: { supported: false } },
    },
  ],
};

const mockModelsRequest = (body = MODELS_RESPONSE, ok = true, status = 200) => {
  global.fetch = jest.fn(async () => ({ ok, status, json: async () => body }));
};

describe('anthropicModel suggester', () => {
  let ctx;
  let adminApp;
  const realFetch = global.fetch;

  beforeAll(async () => {
    ctx = await createTestContext();
    adminApp = await ctx.baseApp.asRole('admin');
  });

  afterAll(async () => {
    global.fetch = realFetch;
    await ctx.close();
  });

  beforeEach(() => {
    clearAnthropicModelCache();
    getSettingSecret.mockReset();
  });

  it('is forbidden for a user who cannot read settings', async () => {
    const baseApp = await ctx.baseApp.asRole('base');
    const result = await baseApp.get('/api/suggestions/anthropicModel');
    expect(result).toBeForbidden();
  });

  it('returns an empty list when no API key is configured', async () => {
    getSettingSecret.mockResolvedValue('');
    const result = await adminApp.get('/api/suggestions/anthropicModel');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([]);
  });

  it('returns the models the API reports', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicModel');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([
      { id: 'claude-opus-5', name: 'Claude Opus 5' },
      { id: 'claude-textonly-1', name: 'Claude Text Only' },
    ]);
  });

  it('does not send the API key to the client', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicModel');
    expect(JSON.stringify(result.body)).not.toContain('sk-test');
  });

  it('filters on the search term', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicModel?q=textonly');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([
      { id: 'claude-textonly-1', name: 'Claude Text Only' },
    ]);
  });

  it('handles a repeated search term', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicModel?q=opus&q=textonly');
    expect(result).toHaveSucceeded();
  });

  it('returns an empty list when the API responds with something other than JSON', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token < in JSON');
      },
    }));
    const result = await adminApp.get('/api/suggestions/anthropicModel');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([]);
  });

  it('returns an empty list when the API rejects the key', async () => {
    getSettingSecret.mockResolvedValue('sk-bad');
    mockModelsRequest({}, false, 401);
    const result = await adminApp.get('/api/suggestions/anthropicModel');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([]);
  });

  it('returns an empty list when the API is unreachable', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    });
    const result = await adminApp.get('/api/suggestions/anthropicModel');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([]);
  });

  it('looks up a single model by id', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicModel/claude-opus-5');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({ id: 'claude-opus-5', name: 'Claude Opus 5' });
  });

  it('echoes back a model it does not recognise so a saved value still renders', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicModel/claude-retired-9');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({ id: 'claude-retired-9', name: 'claude-retired-9' });
  });

  it('offers only vision-capable models for the fast model field', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicFastModel');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([{ id: 'claude-opus-5', name: 'Claude Opus 5' }]);
  });

  it('still resolves a saved fast model that is no longer offered', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get('/api/suggestions/anthropicFastModel/claude-textonly-1');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({
      id: 'claude-textonly-1',
      name: 'Claude Text Only',
    });
  });

  it('caches the model list across requests', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    await adminApp.get('/api/suggestions/anthropicModel');
    await adminApp.get('/api/suggestions/anthropicModel');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches again once the cached list has expired', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);

    await adminApp.get('/api/suggestions/anthropicModel');
    clock.mockReturnValue(start + 61 * 1000);
    await adminApp.get('/api/suggestions/anthropicModel');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    clock.mockRestore();
  });

  // an empty list is what a transient failure looks like, so caching one would
  // hold the dropdown empty for the whole TTL
  it('never caches an empty list', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest({ data: [] });

    await adminApp.get('/api/suggestions/anthropicModel');
    await adminApp.get('/api/suggestions/anthropicModel');

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('serves one upstream call to requests that overlap', async () => {
    getSettingSecret.mockResolvedValue('sk-test');

    // hold the upstream call open so the second request is inside the suggester
    // before the first has anything to cache
    let release;
    const held = new Promise(resolve => {
      release = resolve;
    });
    global.fetch = jest.fn(async () => {
      await held;
      return { ok: true, status: 200, json: async () => MODELS_RESPONSE };
    });

    const both = Promise.all([
      adminApp.get('/api/suggestions/anthropicModel'),
      adminApp.get('/api/suggestions/anthropicModel'),
    ]);
    await sleepAsync(50);
    release();
    const [first, second] = await both;

    expect(first).toHaveSucceeded();
    expect(second).toHaveSucceeded();
    expect(first.body).toEqual(second.body);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
