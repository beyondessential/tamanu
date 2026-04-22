import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class TamanuReview extends Model {
  declare id: string;
  declare isPositive: boolean;
  declare comment: string;
  declare submittedById: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        isPositive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        tableName: 'tamanu_reviews',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'submittedById',
      as: 'submittedBy',
    });
  }

  static getListReferenceAssociations() {
    return ['submittedBy'];
  }
}
