import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class MedicationAdministrationRecordDose extends Model {
  declare id: string;
  declare doseAmount: number;
  declare doseIndex: number;
  declare isRemoved: boolean;
  declare reasonForRemoval?: string;
  declare reasonForChange?: string;
  declare givenTime: Date;
  declare givenByUserId: string;
  declare recordedByUserId: string;
  declare marId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        doseAmount: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        givenTime: dateTimeType('givenTime', {
          allowNull: false,
        }),
        givenByUserId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        recordedByUserId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        marId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isRemoved: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        doseIndex: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        reasonForRemoval: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        reasonForChange: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.MedicationAdministrationRecord, {
      foreignKey: 'marId',
      as: 'medicationAdministrationRecord',
    });
    this.belongsTo(models.User, {
      foreignKey: 'givenByUserId',
      as: 'givenByUser',
    });
    this.belongsTo(models.User, {
      foreignKey: 'recordedByUserId',
      as: 'recordedByUser',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
