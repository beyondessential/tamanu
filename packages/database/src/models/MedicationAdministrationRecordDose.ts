import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class MedicationAdministrationRecordDose extends Model {
  declare id: string;
  declare doseAmount: number;
  declare givenTime: Date;
  declare givenByUserId?: string;
  declare recordedByUserId?: string;
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
        },
        recordedByUserId: {
          type: DataTypes.STRING,
        },
        marId: {
          type: DataTypes.STRING,
          allowNull: false,
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

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
} 
