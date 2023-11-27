import config from 'config';

import { Reader } from './Reader';
export class ConfigFileReader extends Reader {
  async getSettings() {
    return config;
  }
}
