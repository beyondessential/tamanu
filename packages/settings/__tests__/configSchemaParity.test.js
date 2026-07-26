import fs from 'node:fs';
import JSON5 from 'json5';
import { SETTINGS_SCOPES } from '@tamanu/constants';

import { CONFIG_TO_SETTINGS, settingPathOf } from '../src/configToSettings';
import { getScopedSchema } from '../src/schema';
import { getNodeAtPath, isSetting } from '../src/schema/utils';

// A CONFIG_TO_SETTINGS subtree row only lifts config leaves that exist in the scoped
// schema, so a key added to a mapped config block without a matching schema entry is
// silently skipped by both the fallback reader and the upgrade migration (TAM-6864: this
// is how `schedules.bedFeeCharger` arrived from main unmigrated). Guards against the next
// one. Drops out naturally as the mapped blocks leave config.
const CONFIG_FILES = {
  [SETTINGS_SCOPES.CENTRAL]: ['../../central-server/config/default.json5'],
  [SETTINGS_SCOPES.FACILITY]: ['../../facility-server/config/default.json5'],
  [SETTINGS_SCOPES.GLOBAL]: [
    '../../central-server/config/default.json5',
    '../../facility-server/config/default.json5',
  ],
};

// Leaves that are meant to have no setting: these already moved to env (they're read at
// bootstrap, before settings exist) and only remain in config as the compat fallback.
const NOT_SETTINGS = [
  'auth.secret', // AUTH_SECRET
  'auth.refreshToken.secret', // AUTH_REFRESH_TOKEN_SECRET
  'auth.saltRounds', // SALT_ROUNDS
];

const loadConfig = file => JSON5.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const valueAtPath = (obj, path) => path.reduce((node, key) => node?.[key], obj);
const isBranch = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Config leaves under `row` with no schema node at the matching setting path.
const unmappedLeaves = (row, configFile) => {
  const schema = getScopedSchema(row.scope);
  const configPath = Array.isArray(row.config) ? row.config : row.config.split('.');
  const value = valueAtPath(loadConfig(configFile), configPath);
  if (value === undefined) return [];

  const collect = (node, relative) => {
    const settingPath = [settingPathOf(row), ...relative].join('.');
    const schemaNode = getNodeAtPath(schema, settingPath);
    if (isBranch(node) && !(schemaNode && isSetting(schemaNode))) {
      return Object.entries(node).flatMap(([key, child]) => collect(child, [...relative, key]));
    }
    return schemaNode ? [] : [settingPath];
  };
  return collect(value, []);
};

describe('CONFIG_TO_SETTINGS', () => {
  it('maps every config leaf it covers to a setting in the schema', () => {
    const unmapped = CONFIG_TO_SETTINGS.flatMap(row =>
      (CONFIG_FILES[row.scope] ?? []).flatMap(file => unmappedLeaves(row, file)),
    );
    expect([...new Set(unmapped)].sort()).toEqual([...NOT_SETTINGS].sort());
  });
});
