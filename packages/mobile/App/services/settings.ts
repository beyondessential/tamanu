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
    // Merge over existing data so that keys only present in the login response (e.g. mobileSync,
    // which is a central-scope setting not returned by the setFacility endpoint) are preserved
    // when facility-specific settings are applied on top.
    this.data = { ...this.data, ...settings };
    await this._writeDataToConfig();
    this.onDataLoaded();
  }

  getSetting<T>(path: string): T {
    const mergedLocalisations = { ...this.data, ...TEST_SETTINGS_OVERRIDES };
    return get(mergedLocalisations, path);
  }
}
