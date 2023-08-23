import { Reader } from './Reader';

export class SettingsJSONReader extends Reader {
  jsonConfig: any;
  constructor(jsonConfig) {
    super();
    this.jsonConfig = jsonConfig;
  }

  getSettings() {
    return this.jsonConfig;
  }
}
