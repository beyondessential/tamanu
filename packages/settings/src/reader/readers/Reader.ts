export type ReaderSettingResult = Promise<Record<string, string | number> | undefined>;

export class Reader {
  async getSettings() : Promise<Record<string, string | number> | undefined> {
    throw new Error('getSettings() method not implemented');
  }
}
