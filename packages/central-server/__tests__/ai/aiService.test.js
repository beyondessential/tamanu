import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings/cache';
import { getSettingSecret } from '@tamanu/shared/utils/crypto';
import { fetch as undiciFetch } from 'undici';

import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../../app/ApplicationContext';
import { AIService } from '../../app/services/AIService';

vi.mock('undici', async () => {
  const original = await vi.importActual('undici');
  return { ...original, fetch: vi.fn() };
});

vi.mock('@tamanu/shared/utils/crypto', async () => {
  const original = await vi.importActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingSecret: vi.fn(),
  };
});

const FORM_BUILDER_PROMPTS = {
  interpretFormImage: 'interpret',
  processMessage: 'process',
  buildSurveyDefinition: 'build',
  tweakSurveyDefinition: 'tweak',
};

const experimentalAiWith = overrides => ({
  enabled: true,
  model: 'claude-opus-5',
  patientSummary: { enabled: true, prompts: 'patient summary' },
  encounterSummary: { enabled: true, prompts: 'encounter summary' },
  ...overrides,
});

const formBuilderWith = overrides => ({
  enabled: true,
  model: 'claude-opus-5',
  fastModel: '',
  prompts: FORM_BUILDER_PROMPTS,
  ...overrides,
});

const NO_FEDERATION = {
  audience: '',
  organizationId: '',
  federationRuleId: '',
  serviceAccountId: '',
  workspaceId: '',
};

const FEDERATION = {
  audience: 'https://api.anthropic.com',
  organizationId: 'org-uuid',
  federationRuleId: 'fdrl_test',
  serviceAccountId: 'svac_test',
  workspaceId: '',
};

const settingsWith = ({
  experimentalAi = {},
  formBuilder = {},
  federation = NO_FEDERATION,
} = {}) => {
  const values = {
    experimentalAi: experimentalAiWith(experimentalAi),
    formBuilder: formBuilderWith(formBuilder),
    'ai.anthropicFederation': federation,
    metaServer: { hosts: ['https://canopy.test/'] },
  };
  return { get: async path => values[path] };
};

const deviceKeyModels = {
  LocalSystemSecret: {
    getDeviceKey: async () => ({ makeCertificate: () => 'cert', privateKeyPem: () => 'key' }),
  },
};

const initWith = config =>
  AIService.init({ settings: settingsWith(config), models: deviceKeyModels });

describe('AIService.init', () => {
  beforeEach(() => {
    getSettingSecret.mockReset();
    getSettingSecret.mockResolvedValue('sk-test');
  });

  it('builds each feature with its own model', async () => {
    const service = await initWith({
      experimentalAi: { model: 'claude-sonnet-5' },
      formBuilder: { model: 'claude-opus-5', fastModel: 'claude-haiku-5' },
    });
    expect(service.getModelForContext(AI_CONTEXT_NAMES.PATIENT_SUMMARY).model).toBe(
      'claude-sonnet-5',
    );
    expect(service.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER).model).toBe('claude-opus-5');
    expect(service.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER_BUILD).model).toBe(
      'claude-haiku-5',
    );
  });

  it('picks up a changed API key without a restart', async () => {
    getSettingSecret.mockResolvedValue('sk-second');
    const service = await initWith();
    expect(service.summaryModel.apiKey).toBe('sk-second');
  });

  it('falls back to the form builder model when no fast model is configured', async () => {
    const service = await initWith();
    expect(service.formBuilderFastModel).toBe(service.formBuilderModel);
  });

  it('leaves the form builder running when Experimental AI is off', async () => {
    const service = await initWith({ experimentalAi: { enabled: false } });
    expect(service.hasContext(AI_CONTEXT_NAMES.FORM_BUILDER)).toBe(true);
    expect(service.hasContext(AI_CONTEXT_NAMES.PATIENT_SUMMARY)).toBe(false);
    expect(service.hasContext(AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY)).toBe(false);
  });

  it('leaves the summaries running when the form builder is off', async () => {
    const service = await initWith({ formBuilder: { enabled: false } });
    expect(service.hasContext(AI_CONTEXT_NAMES.PATIENT_SUMMARY)).toBe(true);
    expect(service.hasContext(AI_CONTEXT_NAMES.FORM_BUILDER)).toBe(false);
  });

  it('needs both switches on for a summary', async () => {
    const service = await initWith({
      experimentalAi: { patientSummary: { enabled: false, prompts: 'patient summary' } },
    });
    expect(service.hasContext(AI_CONTEXT_NAMES.PATIENT_SUMMARY)).toBe(false);
    expect(service.hasContext(AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY)).toBe(true);
  });

  it('is torn down when both features are disabled or have no model', async () => {
    expect(
      await initWith({ experimentalAi: { enabled: false }, formBuilder: { enabled: false } }),
    ).toBeNull();
    expect(
      await initWith({ experimentalAi: { model: '' }, formBuilder: { model: '' } }),
    ).toBeNull();
  });

  it('is torn down without an API key', async () => {
    getSettingSecret.mockResolvedValue(undefined);
    expect(await initWith()).toBeNull();
  });

  it('runs the form builder on workload identity without an API key', async () => {
    getSettingSecret.mockResolvedValue(undefined);
    const service = await initWith({ federation: FEDERATION });
    expect(service.hasContext(AI_CONTEXT_NAMES.FORM_BUILDER)).toBe(true);
    expect(service.summaryModel).toBeNull();
  });
});

describe('AIService workload identity', () => {
  const jsonResponse = body =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  beforeEach(() => {
    getSettingSecret.mockReset();
    undiciFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exchanges a fresh Canopy identity token and calls Anthropic with the access token', async () => {
    getSettingSecret.mockResolvedValue('sk-should-not-be-used');
    undiciFetch.mockResolvedValue(jsonResponse({ token: 'canopy-jwt' }));
    const anthropicFetch = vi.fn(async url => {
      if (String(url).endsWith('/v1/oauth/token')) {
        return jsonResponse({
          access_token: 'sk-ant-oat01-test',
          token_type: 'Bearer',
          expires_in: 600,
          scope: 'workspace:inference',
        });
      }
      return jsonResponse({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5',
        content: [{ type: 'text', text: 'hello' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 1, output_tokens: 1 },
      });
    });
    vi.stubGlobal('fetch', anthropicFetch);

    const service = await initWith({ federation: FEDERATION });
    await service.invoke(AI_CONTEXT_NAMES.FORM_BUILDER, 'hi');

    const [canopyUrl, canopyRequest] = undiciFetch.mock.calls[0];
    expect(canopyUrl).toBe('https://canopy.test/identity-tokens');
    expect(JSON.parse(canopyRequest.body)).toEqual({
      audience: 'https://api.anthropic.com',
      application_type: 'tamanu-central',
    });

    const [exchangeUrl, exchangeRequest] = anthropicFetch.mock.calls[0];
    expect(String(exchangeUrl)).toBe('https://api.anthropic.com/v1/oauth/token');
    expect(JSON.parse(exchangeRequest.body)).toMatchObject({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 'canopy-jwt',
      organization_id: 'org-uuid',
      federation_rule_id: 'fdrl_test',
      service_account_id: 'svac_test',
    });

    const [messagesUrl, messagesRequest] = anthropicFetch.mock.calls[1];
    expect(String(messagesUrl)).toBe('https://api.anthropic.com/v1/messages');
    const headers = new Headers(messagesRequest.headers);
    expect(headers.get('authorization')).toBe('Bearer sk-ant-oat01-test');
    expect(headers.get('x-api-key')).toBeNull();
  });

  it('fails the request when Canopy refuses the identity token', async () => {
    undiciFetch.mockResolvedValue(new Response('{}', { status: 403 }));
    vi.stubGlobal('fetch', vi.fn());

    const service = await initWith({ federation: FEDERATION });
    await expect(service.invoke(AI_CONTEXT_NAMES.FORM_BUILDER, 'hi')).rejects.toThrow();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('ApplicationContext.refreshAiService', () => {
  const contextFor = settings => {
    const context = Object.create(ApplicationContext.prototype);
    context.appType = CENTRAL_SERVER_APP_TYPES.API;
    context.store = { models: {} };
    context.settings = settings;
    return context;
  };

  // Setting.set commits each key separately, so a cached snapshot can hold half
  // a save. Reading one would leave the service built from it until the next write.
  it('drops the settings cache before reading', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    const order = [];
    const reset = vi.spyOn(settingsCache, 'reset').mockImplementation(() => order.push('reset'));

    const context = contextFor({
      get: async path => {
        order.push('read');
        return {
          experimentalAi: experimentalAiWith(),
          formBuilder: formBuilderWith(),
          'ai.anthropicFederation': NO_FEDERATION,
        }[path];
      },
    });
    await context.refreshAiService();

    expect(order).toEqual(['reset', 'read', 'read', 'read']);
    reset.mockRestore();
  });

  // A settings save and the NOTIFY it raises both refresh, so two can overlap.
  it('keeps the result of the refresh that read the newest settings', async () => {
    getSettingSecret.mockResolvedValue('sk-test');

    // The first refresh reads slowly, so without serialising it would land last
    // and overwrite the second refresh's newer model.
    let isFirstRead = true;
    const context = contextFor({
      get: async path => {
        if (path === 'formBuilder') return formBuilderWith({ enabled: false });
        if (isFirstRead) {
          isFirstRead = false;
          await new Promise(resolve => {
            setTimeout(resolve, 50);
          });
          return experimentalAiWith({ model: 'claude-stale' });
        }
        return experimentalAiWith({ model: 'claude-fresh' });
      },
    });

    await Promise.all([context.refreshAiService(), context.refreshAiService()]);

    expect(context.aiService.summaryModel.model).toBe('claude-fresh');
  });
});

describe('AIService structured responses', () => {
  const responseSchema = z.object({ answer: z.string() });

  const serviceWithModel = (...responses) => {
    const invoke = vi.fn();
    responses.forEach(response => invoke.mockResolvedValueOnce(response));
    const model = { bindTools: vi.fn(() => ({ invoke })) };
    const service = new AIService();
    service.formBuilderModel = model;
    service.formBuilderFastModel = model;
    service.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK, 'tweak');
    return { service, model, invoke };
  };

  const invokeTweak = service =>
    service.invokeStructured(AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK, 'question', responseSchema, {
      name: 'respond',
    });

  it('offers the response tool without forcing it', async () => {
    const { service, model } = serviceWithModel({
      tool_calls: [{ name: 'respond', args: { answer: 'yes' } }],
    });

    expect(await invokeTweak(service)).toEqual({ answer: 'yes' });
    const [tools, options] = model.bindTools.mock.calls[0];
    expect(tools[0].name).toBe('respond');
    expect(options).toEqual({ tool_choice: 'auto' });
  });

  it('asks again when the model first answers without calling the tool', async () => {
    const { service, invoke } = serviceWithModel(
      { content: 'Sure, here you go.', tool_calls: [] },
      { tool_calls: [{ name: 'respond', args: { answer: 'yes' } }] },
    );

    expect(await invokeTweak(service)).toEqual({ answer: 'yes' });
    expect(invoke).toHaveBeenCalledTimes(2);
    const retryMessages = invoke.mock.calls[1][0];
    expect(retryMessages).toHaveLength(3);
    expect(retryMessages.at(-1).content).toBe('Respond by calling the respond tool.');
  });

  it('fails when the model still answers without calling the tool', async () => {
    const { service } = serviceWithModel({ tool_calls: [] }, { tool_calls: [] });

    await expect(invokeTweak(service)).rejects.toThrow('did not call the respond tool');
  });
});
