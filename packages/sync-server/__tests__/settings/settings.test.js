import { readSetting } from '@tamanu/shared/settings-reader/readSetting';
import { SETTINGS_SCOPES } from '@tamanu/shared/constants';
import { settingsCache } from '@tamanu/shared/settings-reader/settingsCache';
import { createTestContext } from '../utilities';
import { createSetting } from './settingsUtils';

jest.mock('@tamanu/shared/settings/central', () => {
  const originalModule = jest.requireActual('@tamanu/shared/settings/central');
  return {
    ...originalModule,
    centralDefaults: {
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
    },
  };
});

jest.mock('@tamanu/shared/settings/global', () => {
  const originalModule = jest.requireActual('@tamanu/shared/settings/global');
  return {
    ...originalModule,
    globalDefaults: {
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
    },
  };
});

describe('Read Settings', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    jest.clearAllMocks();
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    await models.Setting.destroy({ where: {}, force: true });
    settingsCache.reset();
  });

  it('Read a nonexistent setting should retrieve undefined', async () => {
    const value = await readSetting(models, 'nonexistent.config');
    expect(value).toEqual(undefined);
  });

  it('It should merge leafs inside the same attribute', async () => {
    await createSetting(models, 'root.leaf1', 'db-global-value', SETTINGS_SCOPES.GLOBAL);
    await createSetting(models, 'root.leaf2', 'db-central-value', SETTINGS_SCOPES.CENTRAL);
    const value = await readSetting(models, 'root.leaf1');
    expect(value).toEqual('db-global-value');
    const value2 = await readSetting(models, 'root.leaf2');
    expect(value2).toEqual('db-central-value');
  });

  it('Should read value from central file', async () => {
    const value = await readSetting(models, 'honeycomb.sampleRate');
    expect(value).toEqual(100);
  });

  it('Should read value from global file', async () => {
    const value = await readSetting(models, 'survey.defaultCodes.department');
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

    const globalDbValue = await readSetting(models, 'specific.to.global-db');
    expect(globalDbValue).toEqual('db-global-value');

    const centralDbValue = await readSetting(models, 'specific.to.central-db');
    expect(centralDbValue).toEqual('db-central-value');

    const globalFileValue = await readSetting(models, 'specific.to.global-file');
    expect(globalFileValue).toEqual('file-global-value');

    const centralFileValue = await readSetting(models, 'specific.to.central-file');
    expect(centralFileValue).toEqual('file-central-value');

    const value2 = await readSetting(models, 'root.leaf2');
    expect(value2).toEqual('db-central-value');
  });
});
