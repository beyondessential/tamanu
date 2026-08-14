import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../../app/ApplicationContext';
import { AIService } from '../../app/services/AIService';

jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingSecret: jest.fn(),
  };
});

const { getSettingSecret } = jest.requireMock('@tamanu/shared/utils/crypto');

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

describe('ApplicationContext.refreshAiService', () => {
  // A settings save and the NOTIFY it raises both refresh, so two can overlap.
  it('keeps the result of the refresh that read the newest settings', async () => {
    getSettingSecret.mockResolvedValue('sk-test');
    const context = Object.create(ApplicationContext.prototype);
    context.appType = CENTRAL_SERVER_APP_TYPES.API;
    context.store = { models: {} };

    // The first refresh reads slowly, so without serialising it would land last
    // and overwrite the second refresh's newer model.
    let isFirstRead = true;
    context.settings = {
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
    };

    await Promise.all([context.refreshAiService(), context.refreshAiService()]);

    expect(context.aiService.chatModel.model).toBe('claude-fresh');
  });
});
