import { Reader } from './Reader';

export class SettingsDBReader extends Reader {
  constructor(models, scope, facilityId) {
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
