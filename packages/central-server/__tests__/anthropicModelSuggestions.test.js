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
      id: 'claude-haiku-4-5-20251001',
      display_name: 'Claude Haiku 4.5',
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
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
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
    const result = await adminApp.get('/api/suggestions/anthropicModel?q=haiku');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    ]);
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
    const result = await adminApp.get('/api/suggestions/anthropicVisionModel');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([{ id: 'claude-opus-5', name: 'Claude Opus 5' }]);
  });

  it('still resolves a saved fast model that is no longer offered', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    const result = await adminApp.get(
      '/api/suggestions/anthropicVisionModel/claude-haiku-4-5-20251001',
    );
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
    });
  });

  it('caches the model list across requests', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    mockModelsRequest();
    await adminApp.get('/api/suggestions/anthropicModel');
    await adminApp.get('/api/suggestions/anthropicModel');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
