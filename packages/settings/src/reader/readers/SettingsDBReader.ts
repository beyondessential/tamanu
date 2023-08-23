import { Reader } from './Reader';

export class SettingsDBReader extends Reader {
  models: any;
  scope: string;
  facilityId: string | undefined;

  constructor(models: any, scope: string, facilityId?: string) {
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
