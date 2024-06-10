import mitt from 'mitt';
import { get } from 'lodash';

import { LocalDataService } from './localData';

const TEST_SETTINGS_OVERRIDES = {}; // add values to this to test localisation in development

export class SettingsService extends LocalDataService {
  static CONFIG_KEY = 'settings';

  emitter = mitt();

  settings: object;

  extractDataFromPayload(payload: any): object {
    console.log('SettingsService extractDataFromPayload', payload.settings);
    return payload.settings;
  }

  onDataLoaded(): void {
    this.emitter.emit('settingsChanged');
  }

  getSetting<T>(path: string): T {
    const mergedLocalisations = { ...this.data, ...TEST_SETTINGS_OVERRIDES };
    return get(mergedLocalisations, path);
  }
}
