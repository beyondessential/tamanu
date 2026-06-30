import * as yup from 'yup';

// Mock config as a plain nested object (like node-config exposes values, and
// like the partial config mocks elsewhere in the suite) — the reader navigates
// it with lodash get/has rather than node-config's get()/has() methods. The
// factory returns its own object (no outer reference, to avoid jest's hoisting
// TDZ); tests mutate the imported `config` instance directly.
jest.mock('config', () => ({ __esModule: true, default: {} }));

import config from 'config';
import { SettingsConfigReader } from '../src/reader/readers/SettingsConfigReader';

const schema = {
  properties: {
    tasking: {
      properties: {
        upcomingTasksTimeFrame: { type: yup.number(), defaultValue: 8 },
      },
    },
    enabledFlag: { type: yup.boolean(), defaultValue: false },
  },
};

describe('SettingsConfigReader', () => {
  beforeEach(() => {
    for (const key of Object.keys(config)) delete config[key];
  });

  it('returns the local config value for a setting present in config', async () => {
    config.tasking = { upcomingTasksTimeFrame: 12 };
    const result = await new SettingsConfigReader(schema).getSettings();
    expect(result).toEqual({ tasking: { upcomingTasksTimeFrame: 12 } });
  });

  it('omits a setting that has no config value (so it falls through to the default)', async () => {
    const result = await new SettingsConfigReader(schema).getSettings();
    expect(result).toEqual({});
  });

  it('ignores config keys that are not in the schema (no leak of non-settings config)', async () => {
    config.db = { password: 'super-secret' };
    config.enabledFlag = true;
    const result = await new SettingsConfigReader(schema).getSettings();
    expect(result).toEqual({ enabledFlag: true });
    expect(JSON.stringify(result)).not.toContain('super-secret');
  });
});
