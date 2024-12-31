import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class TaskTemplate extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        referenceDataId: {
          type: DataTypes.INTEGER,
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
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
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

  static buildSyncLookupQueryDetails() {
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
