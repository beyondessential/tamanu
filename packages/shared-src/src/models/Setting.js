import { Sequelize, Op } from 'sequelize';
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
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
      },
    );
  }

  static async fetchSettingAsJSON(key = '') {
    const settings = await Setting.findAll({
      where: {
        settingName: {
          [Op.startsWith]: key, // LIKE '{key}%'
        },
      },
    });

    const settingsObject = {};

    for (const currentSetting of settings) {
      let target = settingsObject;
      const pathSegments = currentSetting.settingName.split('.');
      const finalSegment = pathSegments.pop();

      for (const segment of pathSegments) {
        if (!target[segment]) {
          target[segment] = {};
        }
        target = target[segment];
      }
      target[finalSegment] = currentSetting.settingContent;
    }

    if (key === '') {
      return settingsObject;
    }
    return key.split('.').reduce((object, index) => object[index], settingsObject);
  }
}
