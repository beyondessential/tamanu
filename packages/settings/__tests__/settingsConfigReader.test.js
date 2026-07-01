import { SETTINGS_SCOPES } from '@tamanu/constants';

// Mock config as a plain nested object (like node-config exposes values, and like the
// partial config mocks elsewhere in the suite) — the reader navigates it with lodash
// get/has rather than node-config's get()/has() methods. The factory returns its own
// object (no outer reference, to avoid jest's hoisting TDZ); tests mutate the imported
// `config` instance directly.
jest.mock('config', () => ({ __esModule: true, default: {} }));

import config from 'config';
import { SettingsConfigReader } from '../src/reader/readers/SettingsConfigReader';

const readCentral = () => new SettingsConfigReader(SETTINGS_SCOPES.CENTRAL).getSettings();

describe('SettingsConfigReader', () => {
  beforeEach(() => {
    for (const key of Object.keys(config)) delete config[key];
  });

  it('returns the local config value for a mapped setting present in config', async () => {
    config.language = 'fr-FR';
    expect(await readCentral()).toEqual({ language: 'fr-FR' });
  });

  it('omits a mapped setting with no config value (so it falls through to the default)', async () => {
    expect(await readCentral()).toEqual({});
  });

  it('ignores config keys that are not in the map (no leak of non-settings config)', async () => {
    config.db = { password: 'super-secret' };
    config.language = 'fr-FR';
    const result = await readCentral();
    expect(result).toEqual({ language: 'fr-FR' });
    expect(JSON.stringify(result)).not.toContain('super-secret');
  });
});
