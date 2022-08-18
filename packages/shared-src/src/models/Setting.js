import { Sequelize } from 'sequelize';

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
}
