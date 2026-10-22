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
  model: 'claude-opus-5',
  fastModel: '',
  prompts: FORM_BUILDER_PROMPTS,
  ...overrides,
});

const settingsWith = ({ experimentalAi = {}, formBuilder = {} } = {}) => {
  const values = {
    experimentalAi: experimentalAiWith(experimentalAi),
    formBuilder: formBuilderWith(formBuilder),
  };
  return { get: async path => values[path] };
};

const initWith = config => AIService.init({ settings: settingsWith(config), models: {} });

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
    expect(await initWith({ experimentalAi: { model: '' }, formBuilder: { model: '' } })).toBeNull();
  });

  it('is torn down without an API key', async () => {
    getSettingSecret.mockResolvedValue(undefined);
    expect(await initWith()).toBeNull();
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
        return { experimentalAi: experimentalAiWith(), formBuilder: formBuilderWith() }[path];
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
