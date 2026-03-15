import { DataTypes, Op } from 'sequelize';

import { OBJECT_ID_PERMISSION_SCHEMA, PERMISSION_SCHEMA, PermissionVerb, SYNC_DIRECTIONS } from '@tamanu/constants';
import { ValidationError } from '@tamanu/errors';

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

  static validatePermissionSchema(verb: PermissionVerb, noun: string, roleId: string, objectId: string) {
    if (!verb || !noun || !roleId) {
      throw new ValidationError('Each permission requires verb, noun, and roleId');
    }

    const allowedVerbs = objectId
      ? OBJECT_ID_PERMISSION_SCHEMA[noun]
      : PERMISSION_SCHEMA[noun];

    if (!allowedVerbs) {
      throw new ValidationError(
        objectId
          ? `objectId is not supported for noun "${noun}"`
          : `Permissions for noun "${noun}" are not defined in the schema.`,
      );
    }
    if (!allowedVerbs.includes(verb)) {
      throw new ValidationError(`Verb "${verb}" is not valid for noun "${noun}"${objectId ? ' with objectId' : ''}`);
    }
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
