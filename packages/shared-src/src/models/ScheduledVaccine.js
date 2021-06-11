import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class ScheduledVaccine extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        category: Sequelize.STRING,
        label: Sequelize.STRING,
        schedule: Sequelize.STRING,
        weeksFromBirthDue: Sequelize.INTEGER,
        index: Sequelize.INTEGER,
      },
      options,
    );
  }

  static getListReferenceAssociations() {
    return ['vaccine'];
  }

  static initRelations(models) {
    // vaccine is of type drug
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'vaccineId',
      as: 'vaccine',
    });
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;

  static channelRoutes = ['scheduledVaccine'];
}
