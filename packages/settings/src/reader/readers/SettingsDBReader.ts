import { Reader } from './Reader';

interface SettingModel {
  get: (key: string, facilityId?:string, scope?:string)=> any
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

  getSettings() {
    const { Setting } = this.models;
    // Get all settings for the selected scope/facility
    const settings = Setting.get('', this.facilityId, this.scope);

    return settings;
  }
}
