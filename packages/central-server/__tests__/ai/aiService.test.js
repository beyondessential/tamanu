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

const PROMPT_SETTINGS = {
  'formBuilder.prompts': {
    interpretFormImage: 'interpret',
    processMessage: 'process',
    buildSurveyDefinition: 'build',
    tweakSurveyDefinition: 'tweak',
  },
  patientSummary: { prompts: 'patient summary' },
  encounterSummary: { prompts: 'encounter summary' },
};

const settingsWith = ai => ({
  get: async path => (path === 'ai' ? ai : PROMPT_SETTINGS[path]),
});

const initWith = ai => AIService.init({ settings: settingsWith(ai), models: {} });

describe('AIService.init', () => {
  beforeEach(() => {
    getSettingSecret.mockReset();
    getSettingSecret.mockResolvedValue('sk-test');
  });

  it('builds the configured model', async () => {
    const service = await initWith({ enabled: true, anthropicModel: 'claude-opus-5' });
    expect(service.chatModel.model).toBe('claude-opus-5');
  });

  it('picks up a changed model without a restart', async () => {
    const before = await initWith({ enabled: true, anthropicModel: 'claude-opus-5' });
    const after = await initWith({ enabled: true, anthropicModel: 'claude-haiku-4-5' });
    expect(before.chatModel.model).toBe('claude-opus-5');
    expect(after.chatModel.model).toBe('claude-haiku-4-5');
  });

  it('picks up a changed API key without a restart', async () => {
    getSettingSecret.mockResolvedValue('sk-second');
    const service = await initWith({ enabled: true, anthropicModel: 'claude-opus-5' });
    expect(service.chatModel.apiKey).toBe('sk-second');
  });

  it('falls back to the main model when no fast model is configured', async () => {
    const service = await initWith({ enabled: true, anthropicModel: 'claude-opus-5' });
    expect(service.fastChatModel).toBe(service.chatModel);
  });

  it('is torn down when the feature is disabled or the model is cleared', async () => {
    expect(await initWith({ enabled: false, anthropicModel: 'claude-opus-5' })).toBeNull();
    expect(await initWith({ enabled: true, anthropicModel: '' })).toBeNull();
  });
});

describe('AIService.invokeStructured', () => {
  const schema = z.object({ answer: z.string() });

  const serviceWith = chatModel => {
    const service = Object.create(AIService.prototype);
    service.contexts = new Map([[AI_CONTEXT_NAMES.PATIENT_SUMMARY, 'system prompt']]);
    service.chatModel = chatModel;
    service.fastChatModel = chatModel;
    return service;
  };

  const modelReturning = toolCalls => {
    const invoke = vi.fn().mockResolvedValue({ tool_calls: toolCalls });
    const bindTools = vi.fn().mockReturnValue({ invoke });
    return { model: { bindTools }, bindTools, invoke };
  };

  it('binds the tool without forcing tool_choice', async () => {
    const { model, bindTools } = modelReturning([{ name: 'extract', args: { answer: 'yes' } }]);

    await serviceWith(model).invokeStructured(AI_CONTEXT_NAMES.PATIENT_SUMMARY, 'ask', schema);

    expect(bindTools).toHaveBeenCalledTimes(1);
    const [tools, options] = bindTools.mock.calls[0];
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('extract');
    expect(tools[0].input_schema).toMatchObject({ type: 'object' });
    expect(options?.tool_choice).toBeUndefined();
  });

  it('parses the tool call against the schema', async () => {
    const { model } = modelReturning([{ name: 'summary', args: { answer: 'yes' } }]);

    const result = await serviceWith(model).invokeStructured(
      AI_CONTEXT_NAMES.PATIENT_SUMMARY,
      'ask',
      schema,
      { name: 'summary' },
    );

    expect(result).toEqual({ answer: 'yes' });
  });

  it('throws when the model answers without calling the tool', async () => {
    const { model } = modelReturning([]);

    await expect(
      serviceWith(model).invokeStructured(AI_CONTEXT_NAMES.PATIENT_SUMMARY, 'ask', schema),
    ).rejects.toThrow(/no tool call/);
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
        if (path !== 'ai') return PROMPT_SETTINGS[path];
        order.push('read');
        return { enabled: true, anthropicModel: 'claude-opus-5' };
      },
    });
    await context.refreshAiService();

    expect(order).toEqual(['reset', 'read']);
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
        if (path !== 'ai') return PROMPT_SETTINGS[path];
        if (isFirstRead) {
          isFirstRead = false;
          await new Promise(resolve => {
            setTimeout(resolve, 50);
          });
          return { enabled: true, anthropicModel: 'claude-stale' };
        }
        return { enabled: true, anthropicModel: 'claude-fresh' };
      },
    });

    await Promise.all([context.refreshAiService(), context.refreshAiService()]);

    expect(context.aiService.chatModel.model).toBe('claude-fresh');
  });
});
