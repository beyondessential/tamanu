import { SETTINGS_SCOPES } from '@tamanu/constants';
import { get } from 'es-toolkit/compat';

// No local config: isolate the DB-override vs schema-default cascade.
jest.mock('config', () => ({ __esModule: true, default: {} }));

import { buildSettings } from '../src/reader/buildSettings';
import { globalDefaults } from '../src';

// A stub Setting model returning canned values per scope, mimicking Setting.get(key, facilityId, scope)
const makeModels = valuesByScope => ({
  Setting: {
    get: async (_key, _facilityId, scope) => valuesByScope[scope] ?? {},
  },
});

const KEY = 'disk.freeSpaceRequired.gigabytesForUploadingDocuments';

describe('buildSettings cascade', () => {
  // Regression: mergeWith mutates its first arg, and the JSON readers hand back the
  // shared schema-default objects. An override used to get merged into those defaults
  // for the whole process, so once the override was removed the stale value kept being
  // served until restart.
  it('does not let a removed override survive as a polluted default', async () => {
    let override = {};
    const models = {
      Setting: {
        get: async (_key, _facilityId, scope) => (scope === SETTINGS_SCOPES.GLOBAL ? override : {}),
      },
    };

    const def = get(await buildSettings(models), KEY);
    expect(def).not.toBe(999999);

    override = { disk: { freeSpaceRequired: { gigabytesForUploadingDocuments: 999999 } } };
    expect(get(await buildSettings(models), KEY)).toBe(999999);

    override = {};
    expect(get(await buildSettings(models), KEY)).toBe(def);
  });

  it('does not mutate the shared schema default singletons', async () => {
    const before = JSON.parse(JSON.stringify(globalDefaults));
    const models = makeModels({
      [SETTINGS_SCOPES.FACILITY]: { injectedByFacility: 'should-not-persist' },
    });

    await buildSettings(models, 'facility-1');

    expect(globalDefaults).toEqual(before);
    expect(globalDefaults).not.toHaveProperty('injectedByFacility');
  });

  it('does not leak one facility’s DB overrides into another facility', async () => {
    const facilityOneValue = 'facility-1-only-value';
    const facilityOne = await buildSettings(
      makeModels({ [SETTINGS_SCOPES.FACILITY]: { injectedKey: facilityOneValue } }),
      'facility-1',
    );
    expect(facilityOne.injectedKey).toEqual(facilityOneValue);

    // facility-2 has no stored settings, so it must fall back to defaults, never facility-1's value
    const facilityTwo = await buildSettings(makeModels({}), 'facility-2');
    expect(facilityTwo.injectedKey).toBeUndefined();
  });

  it('returns a fresh object rather than the globalDefaults singleton', async () => {
    const settings = await buildSettings(makeModels({}), 'facility-1');
    expect(settings).not.toBe(globalDefaults);
  });
});
