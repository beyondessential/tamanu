import { describe, it, expect } from 'vitest';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { CONFIG_TO_SETTINGS, settingPathOf } from '@tamanu/settings';

import { LATE_CENTRAL_KEYS } from '../../src/steps/1792360406000-migrateLateCentralConfigToSettings.js';
import { LATE_FACILITY_KEYS } from '../../src/steps/1792370000000-migrateLateFacilityConfigToSettings.js';

const mappedPaths = (scope: string) =>
  CONFIG_TO_SETTINGS.filter(entry => entry.scope === scope).map(settingPathOf);

describe('late config migration keys', () => {
  it.each([
    ['central', LATE_CENTRAL_KEYS, SETTINGS_SCOPES.CENTRAL],
    ['facility', LATE_FACILITY_KEYS, SETTINGS_SCOPES.FACILITY],
  ])('every late %s key has a CONFIG_TO_SETTINGS row in that scope', (_, keys, scope) => {
    expect(mappedPaths(scope)).toEqual(expect.arrayContaining(keys));
  });
});
