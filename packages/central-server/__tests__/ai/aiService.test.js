import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings/cache';
import { getSettingSecret } from '@tamanu/shared/utils/crypto';

import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../../app/ApplicationContext';
import { AIService } from '../../app/services/AIService';

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
  prompts: FORM_BUILDER_PROMPTS,
  ...overrides,
});

const fakeDeviceKey = { makeCertificate: () => 'device-cert', privateKeyPem: () => 'device-key' };
const modelsWithDeviceKey = {
  LocalSystemSecret: { getDeviceKey: vi.fn(async () => fakeDeviceKey) },
};

const settingsWith = ({
  experimentalAi = {},
  formBuilder = {},
  metaServerHosts = ['https://meta.example/'],
} = {}) => {
  const values = {
    experimentalAi: experimentalAiWith(experimentalAi),
    formBuilder: formBuilderWith(formBuilder),
    'metaServer.hosts': metaServerHosts,
  };
  return { get: async path => values[path] };
};

const initWith = config =>
  AIService.init({ settings: settingsWith(config), models: modelsWithDeviceKey });

const requestTypeOf = model => model.clientOptions.defaultHeaders['x-ai-request-type'];

describe('AIService.init', () => {
  beforeEach(() => {
    getSettingSecret.mockReset();
    getSettingSecret.mockResolvedValue('sk-test');
  });

  it('builds the summaries with their own model and the deployment key', async () => {
    const service = await initWith({ experimentalAi: { model: 'claude-sonnet-5' } });
    const summaryModel = service.getModelForContext(AI_CONTEXT_NAMES.PATIENT_SUMMARY);
    expect(summaryModel.model).toBe('claude-sonnet-5');
    expect(summaryModel.apiKey).toBe('sk-test');
  });

  it('routes each kind of form builder request through the Canopy gateway', async () => {
    const service = await initWith();
    const chatModel = service.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER);
    expect(chatModel.clientOptions.baseURL).toBe('https://meta.example/ai');
    expect(chatModel.clientOptions.fetchOptions.dispatcher).toBeDefined();
    expect(requestTypeOf(chatModel)).toBe('main');
    expect(requestTypeOf(service.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER_BUILD))).toBe(
      'fast',
    );
    expect(requestTypeOf(service.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE))).toBe(
      'vision',
    );
  });

  it('builds the form builder without an Anthropic key', async () => {
    getSettingSecret.mockResolvedValue(undefined);
    const service = await initWith({ experimentalAi: { enabled: false } });
    expect(service.hasContext(AI_CONTEXT_NAMES.FORM_BUILDER)).toBe(true);
    expect(getSettingSecret).not.toHaveBeenCalled();
  });

  it('leaves the form builder off without a meta server', async () => {
    const service = await initWith({ metaServerHosts: [] });
    expect(service.hasContext(AI_CONTEXT_NAMES.FORM_BUILDER)).toBe(false);
    expect(service.hasContext(AI_CONTEXT_NAMES.PATIENT_SUMMARY)).toBe(true);
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

  it('is torn down when nothing usable is configured', async () => {
    expect(
      await initWith({ experimentalAi: { enabled: false }, formBuilder: { enabled: false } }),
    ).toBeNull();
    expect(
      await initWith({ experimentalAi: { model: '' }, formBuilder: { enabled: false } }),
    ).toBeNull();
    getSettingSecret.mockResolvedValue(undefined);
    expect(await initWith({ formBuilder: { enabled: false } })).toBeNull();
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
          formBuilder: formBuilderWith({ enabled: false }),
        }[path];
      },
    });
    await context.refreshAiService();

    expect(order).toEqual(['reset', 'read', 'read']);
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
    service.formBuilderVisionModel = model;
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
