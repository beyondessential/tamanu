import { SETTINGS_SCOPES } from '@tamanu/constants';

import { buildSettings } from '../src/reader/buildSettings';
import { globalDefaults } from '../src';

// A stub Setting model returning canned values per scope, mimicking Setting.get(key, facilityId, scope)
const makeModels = valuesByScope => ({
  Setting: {
    get: async (_key, _facilityId, scope) => valuesByScope[scope] ?? {},
  },
});

describe('buildSettings cascade', () => {
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
