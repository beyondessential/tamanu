import { DataTypes, Op } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Permission extends Model {
  declare id: string;
  declare verb: string;
  declare noun: string;
  declare objectId?: string;
  declare roleId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        verb: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        noun: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        objectId: DataTypes.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        // creating partial indexes as objectId can be null
        indexes: [
          {
            name: 'permissions_role_id_noun_verb',
            unique: true,
            fields: ['role_id', 'noun', 'verb'],
            where: {
              object_id: {
                [Op.eq]: null,
              },
            },
          },
          {
            name: 'permissions_role_id_noun_verb_object_id',
            unique: true,
            fields: ['role_id', 'noun', 'verb', 'object_id'],
            where: {
              object_id: {
                [Op.ne]: null,
              },
            },
          },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Role, {
      as: 'role',
      foreignKey: 'roleId',
    });
  }

  forResponse() {
    const { noun, verb, objectId } = this.dataValues;
    return {
      verb,
      noun,
      ...(objectId ? { objectId } : undefined),
    };
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
