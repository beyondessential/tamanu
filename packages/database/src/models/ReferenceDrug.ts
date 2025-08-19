import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ReferenceDrug extends Model {
  declare id: string;
  declare referenceDataId: string;
  declare route?: string;
  declare units?: string;
  declare notes?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        referenceDataId: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          references: {
            model: 'referenceData',
            key: 'id',
          },
        },
        route: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        units: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        notes: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
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

  static getFullReferenceAssociations() {
    return ['referenceData'];
  }
}
