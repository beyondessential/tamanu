import { Sequelize } from 'sequelize';

import { Model } from './Model';

export class Setting extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        settingName: { type: Sequelize.STRING, unique: true },
        settingContent: Sequelize.STRING,
      },
      options,
    );
  }
}
