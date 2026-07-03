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
const readGlobal = () => new SettingsConfigReader(SETTINGS_SCOPES.GLOBAL).getSettings();
const readFacility = () => new SettingsConfigReader(SETTINGS_SCOPES.FACILITY).getSettings();

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

  it('serves a renamed key at its setting path (mailgun.from -> mail.from)', async () => {
    config.mailgun = { from: 'legacy@example.com' };
    expect(await readCentral()).toEqual({ mail: { from: 'legacy@example.com' } });
  });

  it('prefers the newer config spelling when both map to the same setting', async () => {
    config.mailgun = { from: 'legacy@example.com' };
    config.mail = { from: 'new@example.com' };
    expect(await readCentral()).toEqual({ mail: { from: 'new@example.com' } });
  });

  it('does not let a default-equal value shadow a renamed legacy lift', async () => {
    config.mailgun = { from: 'legacy@example.com' };
    config.mail = { from: '' }; // shipped default config: equal to the schema default
    expect(await readCentral()).toEqual({ mail: { from: 'legacy@example.com' } });
  });

  it('un-nests a renamed subtree (localisation.data.country -> country)', async () => {
    config.localisation = { data: { country: { name: 'Fiji', 'alpha-2': 'FJ' } } };
    expect(await readGlobal()).toEqual({ country: { name: 'Fiji', 'alpha-2': 'FJ' } });
  });

  it('serves facility-scoped rows and keeps secrets out of a subtree', async () => {
    config.tasking = { upcomingTasksTimeFrame: 12 };
    config.integrations = { mSupplyMed: { enabled: true, password: 'super-secret' } };
    const result = await readFacility();
    expect(result).toEqual({
      tasking: { upcomingTasksTimeFrame: 12 },
      integrations: { mSupplyMed: { enabled: true } },
    });
    expect(JSON.stringify(result)).not.toContain('super-secret');
  });

  it('lifts a config key containing a dot via an array path (socket.io -> websocket)', async () => {
    config['socket.io'] = { enabled: false };
    expect(await readCentral()).toEqual({ websocket: { enabled: false } });
  });

  it('serves clones, so merging into a lifted value cannot mutate config', async () => {
    config.localisation = { data: { imagingTypes: { xRay: { label: 'X-Ray' } } } };
    const first = await readGlobal();
    first.imagingTypes.echocardiogram = { label: 'Echo' };
    expect(config.localisation.data.imagingTypes.echocardiogram).toBeUndefined();
    expect((await readGlobal()).imagingTypes.echocardiogram).toBeUndefined();
  });

  it('lifts every present leaf under a subtree row (schedules)', async () => {
    config.schedules = {
      outpatientDischarger: { schedule: '0 3 * * *', batchSize: 500 },
      notInTheSchema: { schedule: '* * * * *' },
    };
    expect(await readCentral()).toEqual({
      schedules: { outpatientDischarger: { schedule: '0 3 * * *', batchSize: 500 } },
    });
  });
});
