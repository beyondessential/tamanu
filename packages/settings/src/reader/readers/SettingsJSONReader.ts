import { Reader } from './Reader';

export class SettingsJSONReader extends Reader {
  jsonConfig: any;
  constructor(jsonConfig: any) {
    super();
    this.jsonConfig = jsonConfig;
  }

  async getSettings() {
    return this.jsonConfig;
  }
}
