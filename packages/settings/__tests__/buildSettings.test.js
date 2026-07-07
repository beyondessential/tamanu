import { SETTINGS_SCOPES } from '@tamanu/constants';
import { get } from 'es-toolkit/compat';

// No local config: isolate the DB-override vs schema-default cascade.
jest.mock('config', () => ({ __esModule: true, default: {} }));

import { buildSettings } from '../src/reader/buildSettings';

const KEY = 'disk.freeSpaceRequired.gigabytesForUploadingDocuments';

describe('buildSettings', () => {
  // Regression: mergeWith mutates its first arg, and the JSON readers hand back the
  // shared schema-default objects. An override used to get merged into those defaults
  // for the whole process, so once the override was removed the stale value kept being
  // served until restart.
  it('does not let a removed override survive as a polluted default', async () => {
    let override = {};
    const models = {
      Setting: { get: async (_key, _facilityId, scope) =>
        (scope === SETTINGS_SCOPES.GLOBAL ? override : {}) },
    };

    const def = get(await buildSettings(models), KEY);
    expect(def).not.toBe(999999);

    override = { disk: { freeSpaceRequired: { gigabytesForUploadingDocuments: 999999 } } };
    expect(get(await buildSettings(models), KEY)).toBe(999999);

    override = {};
    expect(get(await buildSettings(models), KEY)).toBe(def);
  });
});
