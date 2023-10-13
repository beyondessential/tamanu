import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { permissionCache } from '../permissions/cache';
import { Model } from './Model';

export class Permission extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        verb: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        noun: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        objectId: Sequelize.STRING,
        deletionStatus: Sequelize.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        hooks: {
          afterSave() {
            permissionCache.reset();
          },
          afterBulkCreate() {
            permissionCache.reset();
          },
          afterBulkUpdate() {
            permissionCache.reset();
          },
          afterBulkDestroy() {
            permissionCache.reset();
          },
        },
        // creating partial indexes as objectId can be null
        indexes: [
          {
            name: 'permissions_role_id_noun_verb',
            unique: true,
            fields: ['role_id', 'noun', 'verb'],
            where: {
              object_id: {
                [Sequelize.Op.eq]: null,
              },
            },
          },
          {
            name: 'permissions_role_id_noun_verb_object_id',
            unique: true,
            fields: ['role_id', 'noun', 'verb', 'object_id'],
            where: {
              object_id: {
                [Sequelize.Op.ne]: null,
              },
            },
          },
        ],
      },
    );
  }

  static initRelations(models) {
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
}
