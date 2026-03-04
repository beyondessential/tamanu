import mitt from 'mitt';
import { get } from 'lodash';

import { LocalDataService } from './localData';

const TEST_SETTINGS_OVERRIDES = {}; // add values to this to test settings in development

export class SettingsService extends LocalDataService {
  static CONFIG_KEY = 'settings';

  emitter = mitt();

  settings: object;

  extractDataFromPayload(payload: any): object {
    return payload.settings;
  }

  onDataLoaded(): void {
    this.emitter.emit('settingsChanged');
  }

  async setSettings(settings: object): Promise<void> {
    this.data = settings;
    await this._writeDataToConfig();
    this.onDataLoaded();
  }

  getSetting<T>(path: string): T {
    const mergedLocalisations = { ...this.data, ...TEST_SETTINGS_OVERRIDES };
    return get(mergedLocalisations, path);
  }
}
