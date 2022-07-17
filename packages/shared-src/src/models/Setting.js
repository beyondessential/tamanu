import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

// originally added to support the same use case as localisation, will eventually be merged with it
export class Setting extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        settingName: { type: Sequelize.STRING, unique: true },
        settingContent: Sequelize.STRING,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  static async get(name) {
    const settingRecord = await this.findOne({ where: { settingName: name } });
    if (!settingRecord) {
      return null;
    }
    return settingRecord.settingContent;
  }

  static async set(name, value) {
    await this.upsert(
      { settingName: name, settingContent: value },
      { where: { settingName: name } },
    );
  }
}
