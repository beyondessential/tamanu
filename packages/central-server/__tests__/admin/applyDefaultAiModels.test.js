import { SETTINGS_SCOPES } from '@tamanu/constants';
import { SECRET_PLACEHOLDER } from '@tamanu/settings';
import { createTestContext } from '../utilities';
import { clearAnthropicModelCache } from '../../app/anthropicModelSuggestions';

jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingsPskKeyBuffer: jest.fn(async () => Buffer.alloc(32, 0xab)),
    getSettingSecret: jest.fn(async () => 'sk-test'),
  };
});

const MODELS_RESPONSE = {
  data: [
    {
      id: 'claude-opus-5',
      display_name: 'Claude Opus 5',
      created_at: '2026-07-24T00:00:00Z',
      capabilities: { image_input: { supported: true }, pdf_input: { supported: true } },
    },
    {
      id: 'claude-opus-4-8',
      display_name: 'Claude Opus 4.8',
      created_at: '2026-05-28T00:00:00Z',
      capabilities: { image_input: { supported: true }, pdf_input: { supported: true } },
    },
    {
      id: 'claude-haiku-4-5-20251001',
      display_name: 'Claude Haiku 4.5',
      created_at: '2025-10-15T00:00:00Z',
      capabilities: { image_input: { supported: true }, pdf_input: { supported: true } },
    },
  ],
};

describe('default AI models on first API key', () => {
  let ctx;
  let models;
  let adminApp;
  const realFetch = global.fetch;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');
  });

  afterAll(async () => {
    global.fetch = realFetch;
    await ctx.close();
  });

  beforeEach(async () => {
    await models.Setting.destroy({ where: {}, force: true });
    clearAnthropicModelCache();
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => MODELS_RESPONSE }));
  });

  const saveAi = ai =>
    adminApp
      .put('/v1/admin/settings')
      .send({ settings: { ai }, facilityId: null, scope: SETTINGS_SCOPES.CENTRAL });

  const readAi = async () => (await models.Setting.get('ai', null, SETTINGS_SCOPES.CENTRAL)) ?? {};

  it('selects the latest opus and the latest haiku when the key is first saved', async () => {
    const result = await saveAi({ anthropicApiKey: 'sk-new' });
    expect(result).toHaveSucceeded();

    const ai = await readAi();
    expect(ai.anthropicModel).toBe('claude-opus-5');
    expect(ai.anthropicFastModel).toBe('claude-haiku-4-5-20251001');
  });

  it('returns the selected models on the read the editor makes after saving', async () => {
    await saveAi({ anthropicApiKey: 'sk-new' });

    const result = await adminApp
      .get('/v1/admin/settings')
      .query({ scope: SETTINGS_SCOPES.CENTRAL });
    expect(result).toHaveSucceeded();
    expect(result.body.ai.anthropicModel).toBe('claude-opus-5');
    expect(result.body.ai.anthropicFastModel).toBe('claude-haiku-4-5-20251001');
  });

  it('does not overwrite models an admin has already chosen', async () => {
    const result = await saveAi({
      anthropicApiKey: 'sk-new',
      anthropicModel: 'claude-opus-4-8',
      anthropicFastModel: 'claude-opus-4-8',
    });
    expect(result).toHaveSucceeded();

    const ai = await readAi();
    expect(ai.anthropicModel).toBe('claude-opus-4-8');
    expect(ai.anthropicFastModel).toBe('claude-opus-4-8');
  });

  it('does not re-fill on later saves, so an empty fast model keeps falling back', async () => {
    await saveAi({ anthropicApiKey: 'sk-new' });
    await models.Setting.set('ai.anthropicFastModel', '', SETTINGS_SCOPES.CENTRAL, null);

    const result = await saveAi({ anthropicApiKey: SECRET_PLACEHOLDER });
    expect(result).toHaveSucceeded();

    // an empty fast model reads back as absent, which is the fallback state
    const ai = await readAi();
    expect(ai.anthropicFastModel).toBeFalsy();
  });

  it('saves normally when the model list cannot be fetched', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    });

    const result = await saveAi({ anthropicApiKey: 'sk-new' });
    expect(result).toHaveSucceeded();

    const ai = await readAi();
    expect(ai.anthropicModel).toBeFalsy();
  });
});
