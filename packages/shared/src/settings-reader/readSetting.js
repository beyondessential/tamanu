import { get } from 'lodash';
import { buildSettings } from './buildSettings';
import { settingsCache } from './settingsCache';

export async function readSetting(models, key) {
  let settings = settingsCache.get();
  if (!settings) {
    settings = await buildSettings(models);
    settingsCache.set(settings);
  }

  return get(settings, key);
}
