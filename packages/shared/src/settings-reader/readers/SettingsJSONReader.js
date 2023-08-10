import { Reader } from './Reader';

export class SettingsJSONReader extends Reader {
  constructor(jsonConfig) {
    super();
    this.jsonConfig = jsonConfig;
  }

  getSettings() {
    return this.jsonConfig;
  }
}
