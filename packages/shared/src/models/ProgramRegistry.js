import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES, CURRENTLY_AT_TYPES } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';

export class ProgramRegistry extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.TEXT,
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        currentlyAtType: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        validate: {
          mustHaveValidCurrentlyAtType() {
            if (!CURRENTLY_AT_TYPES.includes(this.currentlyAtType)) {
              throw new InvalidOperationError(`The currentlyAtType must be one of ${
                CURRENTLY_AT_TYPES.join(', ')
              }`);
            }
          }
        }
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Program, {
      foreignKey: 'programId',
      as: 'program',
    });
  }
}
