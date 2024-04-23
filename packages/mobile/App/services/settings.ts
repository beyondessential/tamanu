import mitt from 'mitt';
import { get } from 'lodash';

import { LocalDataService } from './localData';

const TEST_SETTING_OVERRIDES = {}; // add values to this to test settings in development

export class SettingService extends LocalDataService {
  static CONFIG_KEY = 'settings';

  emitter = mitt();

  settings: object;

  extractDataFromPayload(payload: any): object {
    return payload.settings;
  }

  onDataLoaded(): void {
    this.emitter.emit('settingsLoaded');
  }

  getSetting<T>(path: string): T {
    const mergedSettings = { ...this.data, ...TEST_SETTING_OVERRIDES };
    return get(mergedSettings, path);
  }
}
