import { Reader, ReaderSettingResult } from './Reader';

interface SettingModel {
  get: (key: string, facilityId?: string, scope?: string) =>
  Promise<undefined | ReaderSettingResult>
}
export interface Models {
  Setting: SettingModel;
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
    const { Setting } = this.models;
    // Get all settings for the selected scope/facility
    const settings = await Setting.get('', this.facilityId, this.scope);

    return settings;
  }
}
