import { settingsCache } from '@tamanu/settings';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { createSetting } from './settingsUtils';

const mockCentralSettings = {
  log: {
    path: '',
    consoleLevel: 'http',
    color: true,
  },
  specific: {
    to: {
      'central-file': 'file-central-value',
    },
  },
  honeycomb: {
    enabled: true,
    sampleRate: 100, // 100 = 1/100 = 1% of traces get sent to honeycomb
    // in contrast, logs are always sent
  },
};

const mockGlobalSettings = {
  survey: {
    defaultCodes: {
      department: 'GeneralClinic',
      location: 'GeneralClinic',
    },
  },
  specific: {
    to: {
      'global-file': 'file-global-value',
    },
  },
  reportConfig: {
    'encounter-summary-line-list': {
      includedPatientFieldIds: [],
    },
  },
};

const seedMockSettings = async models => {
  await models.Setting.set('', mockCentralSettings, null, SETTINGS_SCOPES.CENTRAL);
  await models.Setting.set('', mockGlobalSettings, null, SETTINGS_SCOPES.GLOBAL);
  settingsCache.reset();
};

describe('Read Settings', () => {
  let ctx;
  let models;
  let settings;

  beforeAll(async () => {
    ctx = await createTestContext();
    settings = ctx.settings;
    models = ctx.store.models;
    jest.clearAllMocks();
    await seedMockSettings(models);
    // clear seeded settings for this test suite
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    await seedMockSettings(models);
  });

  it('Read a nonexistent setting should retrieve undefined', async () => {
    const value = await settings.get('nonexistent.config');
    expect(value).toEqual(undefined);
  });

  it('It should merge leafs inside the same attribute', async () => {
    await createSetting(models, 'root.leaf1', 'db-global-value', SETTINGS_SCOPES.GLOBAL);
    await createSetting(models, 'root.leaf2', 'db-central-value', SETTINGS_SCOPES.CENTRAL);
    const value = await settings.get('root.leaf1');
    expect(value).toEqual('db-global-value');
    const value2 = await settings.get('root.leaf2');
    expect(value2).toEqual('db-central-value');
  });

  it('Should read value from central file', async () => {
    const value = await settings.get('honeycomb.sampleRate');
    expect(value).toEqual(100);
  });

  it('Should read value from global file', async () => {
    const value = await settings.get('survey.defaultCodes.department');
    expect(value).toEqual('GeneralClinic');
  });

  it('Should retrieve merge db configs with file configs', async () => {
    await createSetting(models, 'specific.to.global-db', 'db-global-value', SETTINGS_SCOPES.GLOBAL);
    await createSetting(
      models,
      'specific.to.central-db',
      'db-central-value',
      SETTINGS_SCOPES.CENTRAL,
    );

    const globalDbValue = await settings.get('specific.to.global-db');
    expect(globalDbValue).toEqual('db-global-value');

    const centralDbValue = await settings.get('specific.to.central-db');
    expect(centralDbValue).toEqual('db-central-value');

    const globalFileValue = await settings.get('specific.to.global-file');
    expect(globalFileValue).toEqual('file-global-value');

    const centralFileValue = await settings.get('specific.to.central-file');
    expect(centralFileValue).toEqual('file-central-value');
  });
});
