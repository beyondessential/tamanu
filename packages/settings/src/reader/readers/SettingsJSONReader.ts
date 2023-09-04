import { Reader, ReaderSettingResult } from './Reader';

export class SettingsJSONReader extends Reader {
  jsonConfig: ReaderSettingResult;
  constructor(jsonConfig: ReaderSettingResult) {
    super();
    this.jsonConfig = jsonConfig;
  }

  async getSettings() {
    return this.jsonConfig;
  }
}
