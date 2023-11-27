import { IConfig } from 'config';

export type ReaderSettingResult = Record<string, string | number | boolean | object>;

export class Reader {
  async getSettings() : Promise<ReaderSettingResult | IConfig | undefined> {
    throw new Error('getSettings() method not implemented');
  }
}
