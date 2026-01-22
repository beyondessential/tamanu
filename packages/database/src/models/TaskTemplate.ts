import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class TaskTemplate extends Model {
  declare id: string;
  declare referenceDataId: string;
  declare frequencyValue?: number;
  declare frequencyUnit?: string;
  declare highPriority?: boolean;

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
        frequencyValue: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        frequencyUnit: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        highPriority: {
          type: DataTypes.BOOLEAN,
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
    this.hasMany(models.TaskTemplateDesignation, {
      foreignKey: 'taskTemplateId',
      as: 'designations',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  static getFullReferenceAssociations() {
    const { models } = this.sequelize;

    return [
      'referenceData',
      {
        model: models.TaskTemplateDesignation,
        as: 'designations',
        include: [
          {
            model: models.ReferenceData,
            as: 'designation',
            attributes: ['name'],
          },
        ],
      },
    ];
  }
}
