import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { type InitOptions, type Models } from '../types/model';

export class ReferenceMedicationTemplate extends Model {
  declare id: string;
  declare referenceDataId: string;
  declare isOngoing: boolean;
  declare isPrn: boolean;
  declare isVariableDose: boolean;
  declare doseAmount?: number;
  declare units: string;
  declare frequency: string;
  declare route: string;
  declare durationValue?: number;
  declare durationUnit?: string;
  declare notes?: string;
  declare dischargeQuantity?: number;
  declare medicationId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        isOngoing: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        isPrn: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        isVariableDose: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        doseAmount: DataTypes.DECIMAL,
        units: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        frequency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        route: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        durationValue: DataTypes.DECIMAL,
        durationUnit: DataTypes.STRING,
        notes: DataTypes.STRING,
        dischargeQuantity: DataTypes.INTEGER,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicationId',
      as: 'medication',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referenceDataId',
      as: 'referenceData',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
