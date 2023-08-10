import { get } from 'lodash';
import { buildSettings } from './buildSettings';
import { settingsCache } from './settingsCache';

export async function readSetting(models, key) {
  let settings = settingsCache.get();
  if (!settings) {
    settings = await buildSettings(models);
    settingsCache.set(settings);
  }

  console.log({ settings, key });
  return get(settings, key);
}
