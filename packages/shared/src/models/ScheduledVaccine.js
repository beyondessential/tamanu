import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES, VACCINE_CATEGORIES } from '@tamanu/constants';
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
        weeksFromLastVaccinationDue: Sequelize.INTEGER,
        index: Sequelize.INTEGER,
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static getListReferenceAssociations() {
    return ['vaccine'];
  }

  static async getOtherCategoryScheduledVaccine() {
    // Should only contain 1 scheduled vaccine with Other category per environment
    return this.findOne({ where: { category: VACCINE_CATEGORIES.OTHER } });
  }

  static initRelations(models) {
    // vaccine is of type drug
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'vaccineId',
      as: 'vaccine',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
