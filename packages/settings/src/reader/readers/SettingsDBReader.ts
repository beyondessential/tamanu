import { FACT_DEVICE_ID, SETTINGS_SCOPES } from '@tamanu/constants';

import { Reader, ReaderSettingResult } from './Reader';

/* eslint-disable no-unused-vars */
interface SettingModel {
  get: (
    key: string,
    facilityId?: string | null,
    scope?: string,
    deviceId?: string | null,
  ) => Promise<undefined | ReaderSettingResult>;
}
interface FactModel {
  get: (key: string) => Promise<string | undefined | null>;
}
export interface Models {
  Setting: SettingModel;
  LocalSystemFact?: FactModel;
}

export class SettingsDBReader extends Reader {
  models: Models;
  scope: string;
  facilityId: string | undefined;

  constructor(models: Models, scope: string, facilityId?: string) {
    super();
    this.models = models;
    this.scope = scope;
    this.facilityId = facilityId;
  }

  async getSettings() {
    const { Setting, LocalSystemFact } = this.models;
    if (this.scope === SETTINGS_SCOPES.SERVER) {
      // Server-scope rows are keyed by this machine's device id, resolved
      // lazily so the reader can be built before device init has run.
      const deviceId = await LocalSystemFact?.get(FACT_DEVICE_ID);
      if (!deviceId) return undefined; // fall through to config fallback / defaults
      return Setting.get('', undefined, this.scope, deviceId);
    }
    // Get all settings for the selected scope/facility
    return Setting.get('', this.facilityId, this.scope);
  }
}
