import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VACCINE_CATEGORIES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { ReferenceData } from './ReferenceData';

export class ScheduledVaccine extends Model {
  declare id: string;
  declare category?: string;
  declare label?: string;
  declare doseLabel?: string;
  declare weeksFromBirthDue?: number;
  declare weeksFromLastVaccinationDue?: number;
  declare index?: number;
  declare hideFromCertificate?: boolean;
  declare visibilityStatus: string;
  declare sortIndex: number;
  declare vaccineId?: string;
  declare vaccine?: ReferenceData;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        category: DataTypes.STRING,
        label: DataTypes.STRING,
        doseLabel: DataTypes.STRING,
        weeksFromBirthDue: DataTypes.INTEGER,
        weeksFromLastVaccinationDue: DataTypes.INTEGER,
        index: DataTypes.INTEGER,
        hideFromCertificate: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        sortIndex: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
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

  static initRelations(models: Models) {
    // vaccine is of type drug
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'vaccineId',
      as: 'vaccine',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
